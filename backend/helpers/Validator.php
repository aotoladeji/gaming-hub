<?php
/**
 * Minimal rule-based validator for incoming request payloads.
 *
 * Usage:
 *   $v = new Validator($input, [
 *       'name'  => 'required|string|max:120',
 *       'phone' => 'required|phone',
 *       'hours' => 'required|numeric|min:1|max:12',
 *   ]);
 *   if ($v->fails()) Response::validationError($v->errors());
 */

class Validator
{
    private array $data;
    private array $rules;
    private array $errors = [];

    public function __construct(array $data, array $rules)
    {
        $this->data  = $data;
        $this->rules = $rules;
        $this->run();
    }

    private function run(): void
    {
        foreach ($this->rules as $field => $ruleString) {
            $rules = explode('|', $ruleString);
            $value = $this->data[$field] ?? null;

            foreach ($rules as $rule) {
                [$name, $param] = array_pad(explode(':', $rule, 2), 2, null);
                $this->applyRule($field, $value, $name, $param);
            }
        }
    }

    private function applyRule(string $field, $value, string $rule, ?string $param): void
    {
        switch ($rule) {
            case 'required':
                if ($value === null || $value === '') {
                    $this->addError($field, "$field is required.");
                }
                break;
            case 'string':
                if ($value !== null && !is_string($value)) {
                    $this->addError($field, "$field must be a string.");
                }
                break;
            case 'numeric':
                if ($value !== null && !is_numeric($value)) {
                    $this->addError($field, "$field must be numeric.");
                }
                break;
            case 'integer':
                if ($value !== null && filter_var($value, FILTER_VALIDATE_INT) === false) {
                    $this->addError($field, "$field must be an integer.");
                }
                break;
            case 'max':
                if ($value !== null && is_string($value) && strlen($value) > (int)$param) {
                    $this->addError($field, "$field must not exceed $param characters.");
                } elseif ($value !== null && is_numeric($value) && (float)$value > (float)$param) {
                    $this->addError($field, "$field must not exceed $param.");
                }
                break;
            case 'min':
                if ($value !== null && is_numeric($value) && (float)$value < (float)$param) {
                    $this->addError($field, "$field must be at least $param.");
                }
                break;
            case 'date':
                if ($value !== null && !$this->isValidDate($value)) {
                    $this->addError($field, "$field must be a valid date (YYYY-MM-DD).");
                }
                break;
            case 'time':
                if ($value !== null && !preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $value)) {
                    $this->addError($field, "$field must be a valid time (HH:MM).");
                }
                break;
            case 'phone':
                if ($value !== null && !preg_match('/^[0-9+\-\s()]{7,20}$/', $value)) {
                    $this->addError($field, "$field must be a valid phone number.");
                }
                break;
            case 'email':
                if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "$field must be a valid email address.");
                }
                break;
            case 'in':
                $options = explode(',', (string)$param);
                if ($value !== null && !in_array($value, $options, true)) {
                    $this->addError($field, "$field must be one of: " . implode(', ', $options) . '.');
                }
                break;
        }
    }

    private function isValidDate(string $date): bool
    {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    private function addError(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }

    public function fails(): bool
    {
        return count($this->errors) > 0;
    }

    public function errors(): array
    {
        return $this->errors;
    }
}
