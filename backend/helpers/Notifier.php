<?php
require_once __DIR__ . '/SmtpMailer.php';

/**
 * Best-effort notifications for booking confirmations and cancellations.
 * Never throws out to the caller — a notification failure must not fail
 * a booking. Configure real credentials in config/notifications.php.
 */
class Notifier
{
    private static array $config;

    private static function config(): array
    {
        if (!isset(self::$config)) {
            self::$config = require __DIR__ . '/../config/notifications.php';
        }
        return self::$config;
    }

    public static function sendBookingConfirmation(array $booking): void
    {
        $subject = "Your ITeMS Gaming Hub ticket: {$booking['ticket_number']}";
        $html = self::confirmationHtml($booking);
        $sms = "ITeMS Gaming Hub: Booking confirmed! Ticket {$booking['ticket_number']} for {$booking['game_title']} "
             . "at {$booking['station_name']} on {$booking['booking_date']} {$booking['start_time']}. "
             . "Total: NGN " . number_format((float)$booking['total_price'], 2);

        self::email($booking['customer_email'] ?? null, $booking['customer_name'], $subject, $html);
        self::sms($booking['phone_number'] ?? null, $sms);
    }

    public static function sendCancellation(array $booking): void
    {
        $subject = "Ticket {$booking['ticket_number']} cancelled";
        $html = "<p>Hi {$booking['customer_name']},</p><p>Your ITeMS Gaming Hub booking "
              . "<strong>{$booking['ticket_number']}</strong> for {$booking['game_title']} on "
              . "{$booking['booking_date']} has been cancelled. If this wasn't you, contact the hub.</p>";
        $sms = "ITeMS Gaming Hub: Your booking {$booking['ticket_number']} has been cancelled.";

        self::email($booking['customer_email'] ?? null, $booking['customer_name'], $subject, $html);
        self::sms($booking['phone_number'] ?? null, $sms);
    }

    private static function confirmationHtml(array $b): string
    {
        return "
            <div style='font-family:sans-serif;max-width:480px;margin:0 auto'>
              <h2>Booking Confirmed 🎮</h2>
              <p>Hi {$b['customer_name']}, you're booked in at ITeMS Gaming Hub.</p>
              <table style='width:100%;border-collapse:collapse'>
                <tr><td style='padding:6px 0;color:#666'>Ticket</td><td><strong>{$b['ticket_number']}</strong></td></tr>
                <tr><td style='padding:6px 0;color:#666'>Game</td><td>{$b['game_title']}</td></tr>
                <tr><td style='padding:6px 0;color:#666'>Station</td><td>{$b['station_name']}</td></tr>
                <tr><td style='padding:6px 0;color:#666'>Date</td><td>{$b['booking_date']}</td></tr>
                <tr><td style='padding:6px 0;color:#666'>Time</td><td>{$b['start_time']} – {$b['end_time']}</td></tr>
                <tr><td style='padding:6px 0;color:#666'>Total</td><td><strong>NGN " . number_format((float)$b['total_price'], 2) . "</strong></td></tr>
              </table>
              <p style='color:#999;font-size:12px'>Show this ticket ID at the counter to check in.</p>
            </div>";
    }

    private static function email(?string $to, string $name, string $subject, string $html): void
    {
        $cfg = self::config()['email'];
        if (!$cfg['enabled'] || empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) return;

        try {
            (new SmtpMailer($cfg))->send($to, $name, $subject, $html);
        } catch (Throwable $e) {
            error_log('[Notifier] Email send failed: ' . $e->getMessage());
        }
    }

    private static function sms(?string $to, string $message): void
    {
        $cfg = self::config()['sms'];
        if (!$cfg['enabled'] || empty($to)) return;

        try {
            self::sendViaTermii($cfg, $to, $message);
        } catch (Throwable $e) {
            error_log('[Notifier] SMS send failed: ' . $e->getMessage());
        }
    }

    /** Termii REST API — swap this out for Twilio/Africa's Talking/etc. if preferred. */
    private static function sendViaTermii(array $cfg, string $to, string $message): void
    {
        $payload = json_encode([
            'to'      => $to,
            'from'    => $cfg['sender_id'],
            'sms'     => $message,
            'type'    => 'plain',
            'channel' => 'generic',
            'api_key' => $cfg['api_key'],
        ]);

        $ch = curl_init($cfg['api_url']);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $response = curl_exec($ch);
        $errno = curl_errno($ch);
        curl_close($ch);

        if ($errno) {
            throw new RuntimeException("SMS provider request failed (curl errno $errno)");
        }
    }
}
