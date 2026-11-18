<?php
/**
 * Notification settings. Everything is OFF by default so a fresh install
 * never fails a booking because a mail server isn't configured yet.
 *
 * Email uses a small built-in SMTP client (helpers/SmtpMailer.php) — no
 * Composer/PHPMailer install required. Point it at Gmail, Mailtrap,
 * SendGrid's SMTP relay, your host's SMTP, etc.
 *
 * SMS uses Termii (https://termii.com), a common SMS gateway for Nigerian
 * numbers, over a simple REST call. Swap the provider in Notifier::sendSms()
 * if you use Twilio/Africa's Talking/etc. instead.
 */

return [
    'email' => [
        'enabled'    => false,               // flip to true once SMTP details below are filled in
        'host'       => 'smtp.example.com',
        'port'       => 587,                 // 587 = STARTTLS, 465 = SSL
        'encryption' => 'tls',               // 'tls' | 'ssl' | ''
        'username'   => '',
        'password'   => '',
        'from_email' => 'noreply@itemsgaminghub.com',
        'from_name'  => 'ITeMS Gaming Hub',
    ],
    'sms' => [
        'enabled'   => false,                // flip to true once the API key below is filled in
        'provider'  => 'termii',
        'api_key'   => '',
        'sender_id' => 'ITeMS',
        'api_url'   => 'https://api.ns.termii.com/api/sms/send',
    ],
];
