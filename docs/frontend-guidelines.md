# **Frontend Development Guidelines**

**Project Name:** HeavenHighNYC Shop Platform  
**Last Updated:** [Insert Date]

---

## **1. Introduction**

**Purpose**  
This document provides guidelines for frontend development on the HeavenHighNYC Shop Platform. It ensures consistency, maintainability, and scalability across the customer and admin portals while adhering to best practices.

**Audience**  
Frontend developers, designers, and QA teams.

---

## **2. General Guidelines**

1. **Coding Standards**  
   - Use ES6+ JavaScript features wherever possible.  
   - Use TypeScript for type safety and clearer contracts.  
   - Adhere to Prettier and ESLint configurations to maintain a consistent code style.

2. **Folder Structure**  
   - Organize files by functionality or domain (e.g., `components`, `pages`, `hooks`, `utils`).  
   - Avoid overly deep folder nesting to keep file paths readable.

3. **Component Development**  
   - Prefer **functional components** with hooks.  
   - Break down large UI blocks into **reusable atomic components**.  
   - Follow naming conventions:  
     - `PascalCase` for components (e.g., `MyComponent`).  
     - `camelCase` for variables and functions (e.g., `myFunction`).  

4. **State Management**  
   - Use **local state** (e.g., React’s `useState`) for isolated component behavior.  
   - Leverage **Context API** or **Zustand** for global state management.  
   - Avoid **prop drilling** by abstracting common data and actions into reusable hooks or contexts.

5. **Responsive Design**  
   - Adopt a **mobile-first** approach for layout and styling.  
   - Use **flexbox** or **CSS grid** for responsive layouts.  
   - Test across standard breakpoints: **320px, 768px, 1024px, 1440px** (and any project-specific breakpoints).

---

## **3. Styling Guidelines**

1. **Framework and Tools**  
   - Use **TailwindCSS** for utility-first styling.  
   - Avoid inline styles except for dynamic or conditional styling that cannot be handled with Tailwind utilities.

2. **Theming**  
   - Centralize theme variables (e.g., colors, fonts, spacing) in a dedicated file or Tailwind config.  
   - Ensure consistent use of the theme across **both customer and admin portals**.

3. **Class Naming**  
   - If TailwindCSS utilities are insufficient, use **BEM** (Block-Element-Modifier) for custom classes.  
   - Keep class names **descriptive** and **modular** (e.g., `.product-card__title`).

4. **Dark Mode Support**  
   - Implement dark mode toggles using **TailwindCSS’s dark mode** features or media queries.  
   - Ensure **contrast** and **accessibility** compliance (especially for text and icon colors).

---

## **4. Performance Optimization**

1. **Lazy Loading**  
   - Use `React.lazy` and `Suspense` for **deferred** loading of non-critical components.  
   - Implement **lazy loading for images** with placeholder or shimmer effects.

2. **Minimizing Re-renders**  
   - Use `React.memo` for pure components.  
   - Optimize state updates; localize state changes to prevent unnecessary re-renders of parent components.

3. **Code Splitting**  
   - **Split code by route** using dynamic imports.  
   - Analyze bundle sizes regularly using tools like **webpack-bundle-analyzer** or **Vite** stats.

4. **Asset Optimization**  
   - Compress images and use modern formats (e.g., **WebP**, **AVIF**) where supported.  
   - Use **SVG** for icons and other scalable graphics.

---

## **5. Testing Guidelines**

1. **Unit Testing**  
   - Use **Jest** and **React Testing Library** for component-level tests.  
   - Aim for **80% or higher** test coverage where possible.

2. **Integration Testing**  
   - Test how components **interact** within a page or feature.  
   - Focus on user flows (e.g., adding items to cart, form submission).

3. **End-to-End Testing**  
   - Use **Cypress** to test **critical user journeys** (e.g., login, order placement).  
   - Run E2E tests on CI to ensure no regression in core flows.

4. **Responsiveness Testing**  
   - Test UI on various devices, screen sizes, and browsers.  
   - Use tools like **BrowserStack** or built-in DevTools device emulation.

---

## **6. Accessibility (A11y)**

1. **Compliance**  
   - Target **WCAG 2.1 Level AA** compliance.  
   - Utilize semantic HTML tags wherever possible (e.g., `<main>`, `<header>`).

2. **Focus Management**  
   - Define clear **focus states** for all interactive elements (e.g., buttons, links).  
   - For **modals** and **pop-ups**, trap focus within the active dialog.

3. **ARIA Roles**  
   - Use ARIA roles and attributes (e.g., `role="dialog"`) for non-semantic elements.  
   - Validate with tools like **Lighthouse**, **Axe**, or **WAVE** to ensure correct usage.

4. **Keyboard Navigation**  
   - Ensure **full keyboard accessibility** for all features (e.g., tab sequence, Enter/Space triggers).

---

## **7. Workflow and Tools**

1. **Version Control**  
   - Follow **GitFlow** or a similar branching strategy (`feature/`, `develop/`, `hotfix/`).  
   - Commit frequently with **descriptive messages**.

2. **Code Reviews**  
   - Submit **pull requests** for all feature and bug-fix branches.  
   - Use **peer reviews** or assigned reviewers to maintain code quality.

3. **Dev Tools**  
   - Use browser DevTools (Chrome, Firefox) for debugging, profiling, and inspecting network requests.  
   - Integrate **React Developer Tools** for component hierarchy and performance checks.

4. **Pre-commit Hooks**  
   - Configure tools like **Husky** and **lint-staged** to automatically **lint**, **format**, and run tests before commits.  
   - Prevent failing code from being pushed to the repository.

---

## **8. Future Considerations**

1. **Internationalization (i18n)**  
   - Prepare components for multiple languages.  
   - Use libraries like **react-i18next** or **FormatJS** to handle translations.

2. **Offline Capabilities**  
   - Integrate **service workers** for caching static assets and enabling offline usage.  
   - Consider a **progressive web app (PWA)** approach for enhanced user experience.

3. **Scaling to PWA**  
   - Evaluate whether turning the platform into a **Progressive Web App** offers business or user experience benefits.  
   - Implement best practices like **web app manifest**, **push notifications**, and **offline pages** when the time is right.

---

By following these guidelines, the frontend team can deliver a clean, consistent, and performant user experience. For further clarifications or suggestions, please reach out to the **Frontend Team Lead** or refer to the project’s official documentation.  
