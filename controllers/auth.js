const User = require("../models/user");
const passport = require("passport");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

module.exports.signupForm = (req, res) => {
    res.render("Auth/signup", { style: 'auth' });
}

module.exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email });
        const newUser = await User.register(user, password);
        passport.authenticate('local')(req, res, () => {
            req.flash("success", `Thanks for registration ${newUser.username}`);
            res.redirect("/dashboard");
        })
    } catch (e) {
        const errMssg = 'E11000 duplicate key error collection: Agile11.users index: email_1 dup key:'
        e.message = e.message.includes(errMssg) ? 'This email is already registered. Try to Sign Up with another mail' : e.message;
        req.flash("error", e.message);
        res.redirect("/account/signup");
    }
}

module.exports.forgotPasswordForm = (req, res) => {
    res.render("Auth/forgot", { style: 'auth' });
}

module.exports.forgotPassword = (req, res, next) => {
    async.waterfall([
        done => {
            crypto.randomBytes(20, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) => {
            User.findOne({ email: { $eq: req.body.email } }, (err, user) => {
                if (!user) {
                    req.flash('error', 'No account with this email address was registered');
                    return res.redirect('/account/forgotPass');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(err => {
                    done(err, token, user);
                })
            });
        },
        (token, user, done) => {
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.GMAIL_ADDRESS,
                    pass: process.env.GMAIL_PASS
                }
            });
            const mailOptions = {
                to: user.email,
                from: process.env.GMAIL_ADDRESS,
                subject: 'Agile-11 Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'https://' + req.headers.host + '/account/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, err => {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], err => {
        if (err) return next(err);
        res.redirect('/account/forgotPass');
    });
}

module.exports.resetPasswordForm = (req, res) => {
    const { token } = req.params;
    User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/account/forgotPass');
        }
        res.render('Auth/reset', { token: token, style: 'auth' });
    });
}

module.exports.resetPassword = (req, res) => {
    const { token } = req.params;
    async.waterfall([
        done => {
            User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, err => {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(err => {
                            req.logIn(user, err => {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        (user, done) => {
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.GMAIL_ADDRESS,
                    pass: process.env.GMAIL_PASS
                }
            });
            const mailOptions = {
                to: user.email,
                from: process.env.GMAIL_ADDRESS,
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, err => {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], err => {
        res.redirect('/dashboard');
    });
}
