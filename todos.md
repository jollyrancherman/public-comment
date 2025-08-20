# Public Comment Application - Development Plan

## Phase 1: Foundation & Infrastructure

### Database Setup
- [ ] Install and configure Prisma
- [ ] Design and implement complete database schema
  - [ ] User table with roles enum
  - [ ] EmailOTP table for authentication
  - [ ] Meeting and AgendaItem tables
  - [ ] Comment and CommentOnItem tables (many-to-many)
  - [ ] ModerationLog table for audit trail
  - [ ] Recommendation, RecommendationComment, and Vote tables
- [ ] Set up PostgreSQL with PostGIS extension
- [ ] Create Prisma migrations
- [ ] Add seed data for development

### Authentication System
- [ ] Install and configure Auth.js (NextAuth)
- [ ] Implement custom email OTP provider
  - [ ] OTP generation and hashing
  - [ ] Email sending service integration
  - [ ] OTP verification with attempt tracking
  - [ ] Session management
- [ ] Create auth middleware for role-based access
- [ ] Build login/logout UI components
- [ ] Add rate limiting for OTP requests

## Phase 2: Core Meeting & Agenda Management

### Meeting Management
- [ ] Create meeting CRUD operations
  - [ ] API routes for create/read/update/delete
  - [ ] Zod schemas for validation
- [ ] Build staff dashboard for meeting management
  - [ ] Meeting list view
  - [ ] Meeting creation/edit forms
  - [ ] Meeting status management (upcoming/active/ended)

### Agenda Item Management
- [ ] Implement agenda item CRUD
- [ ] CSV/JSON import functionality
  - [ ] File upload handler
  - [ ] Parser for CSV format
  - [ ] Validation and error handling
- [ ] Agenda item display components
- [ ] Item cutoff time logic

## Phase 3: Comment System

### Comment Submission
- [ ] Create comment submission form
  - [ ] Multi-select for agenda items
  - [ ] Stance selector (For/Against/Concerned/Neutral)
  - [ ] Optional location input with map
- [ ] Implement comment API endpoints
  - [ ] Submission with validation
  - [ ] One-to-many relationship handling
- [ ] Build comment storage with raw/public versions

### Visibility & State Management
- [ ] Implement visibility gating logic
  - [ ] Comments hidden until meeting starts
  - [ ] Roll-over logic for post-meeting comments
- [ ] Create withdrawal functionality
  - [ ] Withdrawal UI
  - [ ] Cutoff time enforcement
- [ ] Build comment state machine (PENDING_VISIBLE → VISIBLE → HIDDEN/WITHDRAWN)

## Phase 4: Moderation Pipeline

### AI Moderation Integration
- [ ] Set up AI service integration (OpenAI/Anthropic)
- [ ] Implement PII detection and redaction
  - [ ] Phone number detection
  - [ ] Email detection
  - [ ] Address detection
- [ ] Build profanity filter
- [ ] Create risk classification system
  - [ ] Harassment detection
  - [ ] Threat detection
  - [ ] Slur detection

### Moderation Dashboard
- [ ] Create moderator interface
  - [ ] Queue of flagged comments
  - [ ] Bulk action capabilities
- [ ] Implement moderation actions
  - [ ] Hide/restore comments
  - [ ] Add moderator notes
- [ ] Build audit log for all actions
- [ ] Create moderation analytics

## Phase 5: Council Dashboard

### Analytics & Metrics
- [ ] Build stance counting system
- [ ] Implement quality metrics
  - [ ] Comment length analysis
  - [ ] Civility scoring
  - [ ] Uniqueness detection
- [ ] Create time series visualizations
  - [ ] Comment submission timeline
  - [ ] Stance trends over time

### Geographic Visualization
- [ ] Integrate PostGIS for spatial queries
- [ ] Build map aggregation by ZIP/district
- [ ] Implement privacy-preserving location rounding
- [ ] Create heat map visualizations

### Export Functionality
- [ ] CSV export for council packets
- [ ] JSON export for data analysis
- [ ] PDF generation for meeting materials
- [ ] Implement scheduled report generation

## Phase 6: Recommendations Forum

### Forum Core
- [ ] Create recommendation submission system
- [ ] Build threaded comment structure
- [ ] Implement upvote/downvote system
- [ ] Add tagging/categorization

### Forum Features
- [ ] Sorting algorithms (hot/new/top)
- [ ] Search and filter functionality
- [ ] Rate limiting for submissions
- [ ] User reputation system

## Phase 7: UI/UX & Accessibility

### Component Library
- [ ] Design system with Tailwind
- [ ] Reusable form components
- [ ] Toast notifications
- [ ] Loading states and skeletons
- [ ] Error boundaries

### Accessibility
- [ ] WCAG 2.1 AA compliance audit
- [ ] Keyboard navigation throughout
- [ ] Screen reader optimization
- [ ] High contrast mode support
- [ ] Form validation with ARIA

## Phase 8: Performance & Security

### Performance Optimization
- [ ] Database query optimization
- [ ] Implement caching strategy
- [ ] Image optimization
- [ ] Code splitting and lazy loading
- [ ] Server component optimization

### Security Hardening
- [ ] Rate limiting across all endpoints
- [ ] CAPTCHA integration
- [ ] IP-based abuse detection
- [ ] Content Security Policy
- [ ] Input sanitization
- [ ] SQL injection prevention

## Phase 9: Testing & Documentation

### Testing
- [ ] Unit tests for utilities
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
- [ ] Accessibility testing
- [ ] Load testing

### Documentation
- [ ] API documentation
- [ ] User guides for each role
- [ ] Deployment documentation
- [ ] Data retention policy
- [ ] Security documentation

## Phase 10: Deployment & Monitoring

### Deployment
- [ ] Environment configuration
- [ ] Database migration strategy
- [ ] CI/CD pipeline setup
- [ ] Staging environment
- [ ] Production deployment

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] User analytics
- [ ] Audit log monitoring

## Next Steps

1. Start with Phase 1: Set up database and authentication
2. Build incrementally, testing each phase
3. Gather feedback early and often
4. Prioritize security and accessibility throughout
5. Document decisions and trade-offs

## Notes

- Follow KISS and YAGNI principles
- Prioritize auditability and transparency
- Ensure all features are accessible
- Build with extensibility in mind
- Test thoroughly at each phase