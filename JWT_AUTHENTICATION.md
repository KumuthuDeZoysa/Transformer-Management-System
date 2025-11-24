# JWT Authentication Implementation

## Overview

This document describes the unified JWT (JSON Web Token) authentication system implemented in the Transformer Management System. The implementation replaces the previous dual authentication system with a single, secure JWT-based approach.

## Architecture

### Backend (Spring Boot)

#### Components

1. **JwtUtil** (`util/JwtUtil.java`)
   - Generates JWT tokens with user claims (userId, username, role)
   - Validates and decodes JWT tokens
   - Extracts claims from tokens
   - Token expiration: 24 hours (configurable)

2. **JwtAuthenticationFilter** (`filter/JwtAuthenticationFilter.java`)
   - Intercepts all HTTP requests
   - Extracts JWT from `Authorization: Bearer <token>` header
   - Validates token and sets Spring Security context
   - Adds user details to request attributes

3. **CustomUserDetailsService** (`service/CustomUserDetailsService.java`)
   - Loads user details from database
   - Integrates with Spring Security authentication

4. **SecurityConfig** (`config/SecurityConfig.java`)
   - Configures Spring Security with JWT filter
   - Defines public endpoints (login, signup)
   - Requires authentication for all other endpoints
   - Stateless session management (no server-side sessions)

5. **AuthController** (`controller/AuthController.java`)
   - `/auth/login` - Authenticate user and return JWT token
   - `/auth/signup` - Register new user and return JWT token
   - `/auth/me` - Get current authenticated user
   - `/auth/logout` - Clear authentication (client-side token removal)

#### Security Features

- **BCrypt Password Hashing**: All passwords encrypted with BCrypt (10 rounds)
- **JWT Signing**: Tokens signed with HS256 algorithm using secret key
- **Token Expiration**: Automatic expiration after 24 hours
- **Stateless Authentication**: No server-side session storage
- **Role-Based Access**: Tokens include user role for authorization

### Frontend (Next.js/React)

#### Components

1. **tokenManager** (`lib/jwt-token.ts`)
   - Client-side token storage using localStorage
   - Token validation and expiration checking
   - JWT token decoding for reading claims
   - Authorization header generation

2. **authApi** (`lib/auth-api.ts`)
   - Login/signup functions
   - Token management after authentication
   - User session handling
   - Logout functionality

3. **backend-api** (`lib/backend-api.ts`)
   - Automatically includes JWT token in all API requests
   - Uses `Authorization: Bearer <token>` header
   - Handles authentication errors

4. **Login Page** (`app/login/page.tsx`)
   - Login and signup interface
   - Automatic redirect if already authenticated
   - Error handling and user feedback

## Configuration

### Backend Configuration (`application.properties`)

```properties
# JWT Configuration
jwt.secret=${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
jwt.expiration=86400000  # 24 hours in milliseconds
```

**Important**: Change the `JWT_SECRET` in production! Use a secure random string.

### Frontend Configuration

Set the backend URL in `.env.local`:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080/api
```

## API Endpoints

### Public Endpoints (No Authentication Required)

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/test` - Health check
- `GET /api/health/**` - Health endpoints

### Protected Endpoints (Authentication Required)

All other endpoints require valid JWT token in `Authorization` header:

- `GET /api/transformers` - Get all transformers
- `POST /api/transformers` - Create transformer
- `GET /api/images` - Get images
- `POST /api/images/upload` - Upload image
- etc.

## Authentication Flow

### Login Flow

1. **User submits credentials** → Frontend login page
2. **POST /api/auth/login** → Backend validates credentials
3. **BCrypt password check** → Compare hashed passwords
4. **Generate JWT token** → Include userId, username, role
5. **Return token + user data** → Frontend receives response
6. **Store token** → Save in localStorage
7. **Include in requests** → Add `Authorization: Bearer <token>` header

### Request Flow

1. **User makes API request** → Frontend calls API
2. **Add JWT token** → tokenManager adds Authorization header
3. **JwtAuthenticationFilter** → Backend intercepts request
4. **Validate token** → Check signature and expiration
5. **Set security context** → Add user to Spring Security
6. **Process request** → Controller handles authenticated request
7. **Return response** → Data sent back to frontend

### Logout Flow

1. **User clicks logout** → Frontend logout action
2. **Remove token** → Delete from localStorage
3. **Redirect to login** → User sent to login page
4. **Token becomes invalid** → Server won't accept removed token

## Security Considerations

### Strengths

✅ **Stateless authentication** - No server-side session storage
✅ **Encrypted passwords** - BCrypt with automatic salt
✅ **Token expiration** - Automatic 24-hour timeout
✅ **Signed tokens** - Tamper-proof with HS256
✅ **HTTPS ready** - Secure transmission in production
✅ **Role-based authorization** - User roles in token claims

### Current Limitations

⚠️ **Token refresh not implemented** - Users must re-login after 24 hours
⚠️ **No token revocation** - Tokens valid until expiration
⚠️ **localStorage storage** - Vulnerable to XSS attacks
⚠️ **No rate limiting** - Vulnerable to brute force attacks
⚠️ **Single secret key** - No key rotation implemented

### Production Recommendations

1. **Use HTTPS everywhere** - Encrypt all traffic
2. **Implement token refresh** - Extend sessions without re-login
3. **Add rate limiting** - Prevent brute force attacks
4. **Store tokens in httpOnly cookies** - More secure than localStorage
5. **Implement token blacklist** - Revoke compromised tokens
6. **Add password complexity rules** - Enforce strong passwords
7. **Enable account lockout** - After failed login attempts
8. **Use environment-specific secrets** - Different keys per environment
9. **Implement key rotation** - Periodically change JWT secret
10. **Add MFA support** - Multi-factor authentication

## Testing

### Test Login

```bash
# Login request
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "message": "Login successful",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "testuser",
    "role": "user"
  }
}
```

### Test Protected Endpoint

```bash
# Get transformers with JWT
curl http://localhost:8080/api/transformers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

## Migration from Old System

### Changes Required

1. **Frontend**: Update all API calls to use new auth-api
2. **Remove old auth routes**: Delete `/api/auth/login` Next.js route
3. **Update authentication checks**: Use `tokenManager.isAuthenticated()`
4. **Add Authorization headers**: Automatically added by backend-api
5. **Handle 401 errors**: Redirect to login on authentication failure

### Backward Compatibility

The old Supabase-based authentication routes still exist but should not be used. They will be removed in a future update.

## Troubleshooting

### "Invalid credentials" error
- Check username and password
- Verify user exists in database
- Check BCrypt password hashing

### "401 Unauthorized" on API calls
- Verify JWT token is being sent in Authorization header
- Check token expiration (24 hours)
- Verify JWT secret matches between environments

### CORS errors
- Verify frontend origin in SecurityConfig
- Check CORS configuration allows Authorization header

### Token decode errors
- Verify JWT secret is correct
- Check token format (Bearer <token>)
- Ensure token hasn't been modified

## References

- [JWT.io](https://jwt.io/) - JWT debugger and documentation
- [Spring Security](https://spring.io/projects/spring-security) - Spring Security documentation
- [JJWT](https://github.com/jwtk/jjwt) - Java JWT library
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
