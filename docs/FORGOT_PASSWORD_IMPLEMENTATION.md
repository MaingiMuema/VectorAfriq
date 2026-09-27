# Forgot Password Implementation

This document describes the robust forgot password functionality implemented for the VectorAfriq application.

## Overview

The forgot password system provides a secure way for users to reset their passwords when they forget them. It includes:

- Email-based password reset
- Secure token generation and validation
- Time-limited reset links (1 hour expiration)
- One-time use tokens
- Comprehensive error handling
- User-friendly UI/UX

## Database Schema

### Password Reset Token Table

```sql
CREATE TABLE `password_reset_token` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `expires` datetime(3) NOT NULL,
  `used` boolean NOT NULL DEFAULT false,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PasswordResetToken_token_key` (`token`),
  KEY `PasswordResetToken_email_idx` (`email`),
  KEY `PasswordResetToken_expires_idx` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API Endpoints

### 1. Request Password Reset
- **Endpoint**: `POST /api/auth/forgot-password`
- **Purpose**: Initiates password reset process
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: Success message (doesn't reveal if email exists)

### 2. Validate Reset Token
- **Endpoint**: `POST /api/auth/validate-reset-token`
- **Purpose**: Validates reset token before showing reset form
- **Request Body**: `{ "token": "reset_token_here" }`
- **Response**: `{ "valid": true }` or error

### 3. Reset Password
- **Endpoint**: `POST /api/auth/reset-password`
- **Purpose**: Resets password with valid token
- **Request Body**: `{ "token": "reset_token_here", "password": "new_password" }`
- **Response**: Success message

## Pages

### 1. Forgot Password Page
- **Route**: `/auth/forgot-password`
- **Purpose**: Form to request password reset
- **Features**: Email validation, loading states, success feedback

### 2. Reset Password Page
- **Route**: `/auth/reset-password?token=reset_token_here`
- **Purpose**: Form to set new password
- **Features**: Token validation, password confirmation, strength validation

## Security Features

### 1. Token Security
- 32-byte cryptographically secure random tokens
- 1-hour expiration time
- One-time use (marked as used after password reset)
- Unique constraint prevents duplicate tokens

### 2. Email Security
- Doesn't reveal if email exists in database
- Secure email templates with proper branding
- Fallback text links in case HTML doesn't render

### 3. Password Security
- Minimum 6 character requirement
- Password confirmation validation
- Bcrypt hashing for new passwords
- Old password tokens are invalidated

### 4. Rate Limiting
- Database-level protection against token flooding
- Automatic cleanup of expired tokens
- Single active token per email address

## Email Service

### Configuration
The email service uses nodemailer with the following environment variables:
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port (default: 587)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_SECURE`: Use SSL/TLS (default: false)
- `SMTP_FROM`: From email address
- `NEXTAUTH_URL`: Base URL for reset links

### Email Template
- Professional HTML email template
- VectorAfriq branding
- Clear call-to-action button
- Fallback text link
- Security disclaimers

## User Experience

### 1. Request Flow
1. User clicks "Forgot your password?" on sign-in page
2. User enters email address
3. System sends reset email (if account exists)
4. User receives success message

### 2. Reset Flow
1. User clicks link in email
2. System validates token
3. User enters new password and confirmation
4. System updates password and invalidates token
5. User is redirected to sign-in page

### 3. Error Handling
- Invalid/expired token handling
- Network error recovery
- Email delivery failure handling
- Password validation feedback

## Implementation Files

### Backend
- `src/app/api/auth/forgot-password/route.ts` - Request password reset
- `src/app/api/auth/validate-reset-token/route.ts` - Validate tokens
- `src/app/api/auth/reset-password/route.ts` - Reset password
- `src/lib/email.ts` - Email service utility

### Frontend
- `src/app/auth/forgot-password/page.tsx` - Forgot password page
- `src/app/auth/reset-password/page.tsx` - Reset password page
- `src/components/auth/AuthForm.tsx` - Updated with forgot password link

### Database
- `src/utils/migrations/create_password_reset_table.sql` - Migration file
- `src/scripts/run-password-reset-migration.js` - Migration runner

## Setup Instructions

### 1. Run Database Migration
```bash
node src/scripts/run-password-reset-migration.js
```

### 2. Configure Email Settings
Add the following environment variables to your `.env.local`:
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
SMTP_FROM=noreply@yourdomain.com
NEXTAUTH_URL=http://localhost:3000
```

### 3. Test the Implementation
1. Start the development server
2. Navigate to `/auth/signin`
3. Click "Forgot your password?"
4. Enter a valid email address
5. Check email for reset link
6. Follow the reset process

## Security Considerations

### 1. Token Management
- Tokens are automatically cleaned up when expired
- Only one active token per email address
- Tokens are invalidated after use

### 2. Email Security
- No information leakage about account existence
- Secure token transmission via email
- Professional email templates

### 3. Password Security
- Strong password requirements
- Secure password hashing
- Password confirmation validation

### 4. Rate Limiting
- Database constraints prevent abuse
- Automatic token expiration
- Single token per email limit

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP configuration
   - Verify environment variables
   - Check server logs for errors

2. **Token validation failing**
   - Ensure database migration ran successfully
   - Check token expiration time
   - Verify database connection

3. **Password reset not working**
   - Check password requirements
   - Verify token is not already used
   - Ensure proper error handling

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed error messages and database queries.

## Future Enhancements

1. **Rate Limiting**: Implement IP-based rate limiting
2. **Audit Logging**: Log password reset attempts
3. **SMS Option**: Add SMS-based password reset
4. **Security Questions**: Add security questions for additional verification
5. **Password History**: Prevent reuse of recent passwords












