# Contributing to MobileUurka

Thank you for your interest in contributing to MobileUurka! This guide will help you understand our development workflow and documentation standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Documentation Guidelines](#documentation-guidelines)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Documentation Maintenance](#documentation-maintenance)

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Set up your environment variables (see [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md))
5. Start the development server: `npm run dev`

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Message Format

```
type(scope): brief description

Detailed explanation if needed

- List any breaking changes
- Reference issues: Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Documentation Guidelines

### When to Update Documentation

Documentation MUST be updated when:

- Adding new features or components
- Changing existing API interfaces
- Modifying configuration requirements
- Adding or removing dependencies
- Changing deployment procedures
- Updating environment variables

### Documentation Structure

Our documentation follows this hierarchy:

```
├── README.md                    # Project overview and quick start
├── CONTRIBUTING.md             # This file - development guidelines
├── docs/
│   ├── AI_CHATBOT_GUIDE.md    # AI chatbot implementation
│   ├── DEPLOYMENT_GUIDE.md     # Deployment and environment setup
│   ├── FORM_INTEGRATION_GUIDE.md # Form patterns and integration
│   ├── REDUX_INTEGRATION.md    # Redux patterns and state management
│   └── SOCKET_INTEGRATION.md   # Socket.io real-time features
└── .kiro/
    └── docs/
        └── templates/          # Documentation templates
```

### Documentation Update Process

1. **Before Making Changes**
   - Review existing documentation for the area you're modifying
   - Identify which documents need updates
   - Check if new documentation is needed

2. **During Development**
   - Update relevant documentation as you implement changes
   - Add code examples from your actual implementation
   - Test all code examples to ensure they work

3. **Before Submitting PR**
   - Run documentation validation checks
   - Verify all links work correctly
   - Ensure consistent terminology across documents

### Writing Guidelines

#### Content Standards

- **Accuracy**: Only document features that actually exist in the codebase
- **Clarity**: Write for developers who are new to the project
- **Completeness**: Include all necessary information for the task
- **Currency**: Keep information up-to-date with the latest code

#### Code Examples

- Extract examples from working code when possible
- Include complete, runnable examples
- Add comments explaining key concepts
- Test examples before including them

#### Formatting Standards

- Use clear, descriptive headings
- Include table of contents for longer documents
- Use code blocks with appropriate language tags
- Add cross-references to related documentation

## Code Standards

### React Components

- Use functional components with hooks
- Follow existing naming conventions
- Include PropTypes or TypeScript definitions
- Add JSDoc comments for complex components

### State Management

- Use Redux Toolkit for global state
- Follow existing slice patterns
- Document new actions and reducers
- Include state shape documentation

### Socket Integration

- Follow patterns in `src/config/socket.js`
- Use the `useSocket` hook for components
- Document new socket events
- Include error handling

## Pull Request Process

### Before Submitting

1. **Code Quality**
   - [ ] Code follows project conventions
   - [ ] All tests pass
   - [ ] No console errors or warnings
   - [ ] Code is properly commented

2. **Documentation**
   - [ ] Relevant documentation updated
   - [ ] Code examples tested
   - [ ] Links verified
   - [ ] Consistent terminology used

3. **Testing**
   - [ ] Feature works as expected
   - [ ] No regressions introduced
   - [ ] Edge cases considered

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Breaking change

## Documentation Updates
- [ ] README.md updated
- [ ] Technical guides updated
- [ ] Code examples added/updated
- [ ] Links verified

## Testing
- [ ] Manual testing completed
- [ ] Code examples tested
- [ ] No regressions found

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Changes are backward compatible (or breaking changes documented)
```

### Review Process

1. **Automated Checks**
   - Linting and formatting
   - Documentation link validation
   - Code example compilation

2. **Manual Review**
   - Code quality and architecture
   - Documentation accuracy and clarity
   - User experience considerations

3. **Approval Requirements**
   - At least one maintainer approval
   - All automated checks passing
   - Documentation review completed

## Documentation Maintenance

### Regular Maintenance Tasks

#### Monthly Reviews
- Verify all code examples still work
- Check for broken links
- Update dependency versions in documentation
- Review and update feature descriptions

#### After Major Releases
- Update version numbers across all documentation
- Review and update installation instructions
- Verify deployment guides are current
- Update screenshots and examples

#### Continuous Maintenance
- Fix broken links immediately when found
- Update documentation with code changes
- Respond to documentation issues promptly
- Keep terminology consistent across documents

### Documentation Review Checklist

Use this checklist when reviewing documentation changes:

#### Content Accuracy
- [ ] All claimed features exist in the codebase
- [ ] Code examples compile and run correctly
- [ ] Version numbers and dependencies are current
- [ ] Installation instructions work on clean environment

#### Structure and Navigation
- [ ] Information is logically organized
- [ ] Cross-references are accurate and helpful
- [ ] Table of contents is complete and accurate
- [ ] Related documents are properly linked

#### Writing Quality
- [ ] Language is clear and accessible
- [ ] Technical terms are explained when first used
- [ ] Examples are complete and well-commented
- [ ] Formatting is consistent with project standards

#### User Experience
- [ ] New developers can follow instructions successfully
- [ ] Common use cases are covered
- [ ] Troubleshooting information is provided
- [ ] Next steps are clear

### Reporting Documentation Issues

If you find documentation problems:

1. **For Minor Issues** (typos, broken links)
   - Submit a PR with the fix
   - Include "docs:" in commit message

2. **For Major Issues** (inaccurate information, missing guides)
   - Create an issue with "documentation" label
   - Describe the problem and suggested solution
   - Include relevant code or examples

3. **For New Documentation Needs**
   - Create an issue with "documentation" and "enhancement" labels
   - Describe what documentation is needed and why
   - Suggest the appropriate location for the new content

### Documentation Templates

Templates for common documentation types are available in `.kiro/docs/templates/`:

- `technical-guide-template.md` - For implementation guides
- `api-reference-template.md` - For API documentation
- `troubleshooting-template.md` - For troubleshooting guides

### Documentation Maintenance Framework

Our documentation maintenance framework includes:

- **Review Checklist**: Use `.kiro/docs/documentation-review-checklist.md` when reviewing documentation changes
- **Cross-Reference Validation**: Run `.kiro/docs/scripts/validate-cross-references.js` to check internal links
- **Maintenance Process**: Follow `.kiro/docs/documentation-maintenance-process.md` for keeping docs current

#### Automated Validation

Before submitting documentation changes, run:

```bash
# Validate all documentation
npm run docs:validate

# Check cross-references
node .kiro/docs/scripts/validate-cross-references.js

# Test code examples
npm run docs:test-examples
```

## Getting Help

- **General Questions**: Create a discussion or issue
- **Documentation Issues**: Use the "documentation" label
- **Code Review**: Tag maintainers in your PR
- **Urgent Issues**: Contact maintainers directly

## Recognition

Contributors who help maintain and improve our documentation are recognized in:
- README.md contributors section
- Release notes for significant documentation improvements
- Special thanks in relevant documentation files

Thank you for helping make MobileUurka better for everyone!