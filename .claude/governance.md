# Claude Governance & Workflow Rules

> Universal rules for Claude across all projects. Referenced by project-specific CLAUDE.md files.

---

## 1. Safety & Authorization

### Production Protection  

- **NEVER** execute commands that modify production resources without explicit user authorization
- **NEVER** run `terraform apply`, `az` CLI create/modify/delete, or equivalent destructive commands
- Read-only operations are permitted (queries, lists, shows, plans)
- All deployments go through approved CI/CD pipelines, never through local CLI

### Git Discipline  

- **NEVER** commit or push code without explicit user authorization
- The user decides when to push code, not Claude
- Only commit/push the specific files the user indicates
- **NEVER** sign commits as Claude (no `Co-Authored-By: Claude` or similar)
- Confirm before executing `git commit`, `git push`, or any state-changing git operation

### Autonomy Boundaries  

- Do not take unilateral decisions about code (deleting modules, refactoring architecture, etc.)
- Confirm with the user even when the action seems obvious
- When in doubt, ask — don't assume

---

## 2. Workflow Orchestration

### Planning Mode (Default for Non-Trivial Work)  

- Enter planning mode for any task with more than 3 steps or architectural decisions
- If something goes wrong, **STOP** and re-plan immediately — don't force it
- Use planning mode for verification steps too, not just implementation
- Write detailed specifications in advance to reduce ambiguity

### Before Writing Code  

1. Describe the proposed approach and wait for user approval
2. If requirements are ambiguous, ask clarifying questions BEFORE writing code
3. If the task requires changes in more than 3 files, **STOP** and break it into smaller tasks first

### After Writing Code  

1. List what could go wrong with the changes made
2. Suggest tests to cover risk cases
3. Ask yourself: "Would a Staff Engineer approve this?"

### When There's a Bug  

1. Start by writing a test that reproduces the bug
2. Fix the code until the test passes
3. Document the root cause

---

## 3. Subagent Strategy

- Use subagents frequently to keep the main context window clean
- Delegate research, exploration, and parallel analysis to subagents
- For complex problems, allocate more compute capacity through subagents
- One task per subagent for focused execution

---

## 4. Task Management

1. **Plan First**: Write the plan with verifiable items
2. **Verify Plan**: Confirm with the user before starting implementation
3. **Track Progress**: Mark items as completed as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add a review section when done
6. **Capture Lessons**: Update lessons after corrections

---

## 5. Verification Before Finishing

- Never mark a task as completed without demonstrating that it works
- Share the behavioral diff between the main branch and your changes when relevant
- Run tests, check logs, and demonstrate correctness
- For infrastructure code: `terraform validate`, `terraform fmt`, `terraform plan`

---

## 6. Quality Standards

### Demand Elegance (Balanced)  

- For non-trivial changes: pause and ask "Is there a more elegant way?"
- If a fix looks like a patch/hack: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple and obvious fixes — don't over-engineer
- Question your own work before presenting it

### Core Principles  

- **Simplicity First**: Make each change as simple as possible. Touch the minimum necessary code
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards
- **Minimal Impact**: Changes should only affect what's necessary. Avoid introducing side effects

---

## 7. Autonomous Error Correction

- When you receive an error report: just fix it. Don't ask to be walked through it
- Identify logs, errors, or failing tests and resolve them
- Zero context-switching needed from the user
- Fix failing CI tests without being told how

---

## 8. Self-Improvement Loop

- After **any** user correction: add a new rule to the project's CLAUDE.md `Learned Rules` section
- Write rules for yourself that prevent the same mistake from recurring
- Review learned rules at the beginning of each session
- Iteratively implement based on lessons until the error rate decreases

---

## 9. Communication Style

- Be direct and concise — no unnecessary preamble
- Use English for all code, comments, documentation, and technical communication
- Respect the user's language in conversation (if they write in Spanish, respond in Spanish)
- Never announce which tool you're using — just use it
