<?php
/**
 * A small, self-contained SMTP client — no Composer/PHPMailer dependency.
 * Supports plaintext AUTH LOGIN over TLS/SSL, which covers the vast majority
 * of SMTP relays (Gmail, Mailtrap, SendGrid, most shared hosting).
 *
 * Throws RuntimeException on any protocol failure; callers should catch it
 * and treat email as best-effort (never let it block a booking).
 */
class SmtpMailer
{
    private string $host;
    private int $port;
    private string $encryption;
    private string $username;
    private string $password;
    private string $fromEmail;
    private string $fromName;

    public function __construct(array $config)
    {
        $this->host       = $config['host'];
        $this->port       = $config['port'];
        $this->encryption = $config['encryption'];
        $this->username   = $config['username'];
        $this->password   = $config['password'];
        $this->fromEmail  = $config['from_email'];
        $this->fromName   = $config['from_name'];
    }

    public function send(string $toEmail, string $toName, string $subject, string $htmlBody): void
    {
        $transport = $this->encryption === 'ssl' ? 'ssl://' : '';
        $socket = @stream_socket_client(
            "{$transport}{$this->host}:{$this->port}",
            $errno, $errstr, 15,
            STREAM_CLIENT_CONNECT,
            stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]])
        );
        if (!$socket) {
            throw new RuntimeException("SMTP connection failed: $errstr ($errno)");
        }

        $this->expect($socket, 220);
        $this->command($socket, "EHLO " . gethostname(), 250);

        if ($this->encryption === 'tls') {
            $this->command($socket, "STARTTLS", 220);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS negotiation failed.');
            }
            $this->command($socket, "EHLO " . gethostname(), 250);
        }

        if ($this->username !== '') {
            $this->command($socket, "AUTH LOGIN", 334);
            $this->command($socket, base64_encode($this->username), 334);
            $this->command($socket, base64_encode($this->password), 235);
        }

        $this->command($socket, "MAIL FROM:<{$this->fromEmail}>", 250);
        $this->command($socket, "RCPT TO:<{$toEmail}>", 250);
        $this->command($socket, "DATA", 354);

        $headers = [
            "From: {$this->fromName} <{$this->fromEmail}>",
            "To: {$toName} <{$toEmail}>",
            "Subject: {$subject}",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
        ];
        $message = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.";
        $this->command($socket, $message, 250);

        $this->command($socket, "QUIT", 221);
        fclose($socket);
    }

    private function expect($socket, int $expectedCode): string
    {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') break; // last line of a multi-line response
        }
        $code = (int)substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new RuntimeException("SMTP error: expected $expectedCode, got: " . trim($response));
        }
        return $response;
    }

    private function command($socket, string $command, int $expectedCode): string
    {
        fwrite($socket, $command . "\r\n");
        return $this->expect($socket, $expectedCode);
    }
}
