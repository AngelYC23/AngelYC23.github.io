# Lightbeast - To-Do List Web App

A fully functional, polished To-Do List web application built with **vanilla HTML, CSS, and JavaScript** (no frameworks, no libraries, no CDNs).

![Lightbeast Logo](data:image/svg+xml,%3Csvg%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236366f1%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M9%2011l3%203L22%204%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M21%2012v7a2%202%200%2001-2%202H5a2%202%200%2001-2-2V5a2%202%200%20012-2h11%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E)

## Features

### 🎯 Task Management
- **Add, Edit, Delete** tasks with title, description, due date, priority, and category
- **Mark tasks** as complete/incomplete
- **Clear all completed** tasks with one click
- **Drag & drop** to reorder tasks or move between days

### 📅 Views
- **Daily View**: Focus on today's tasks
- **Weekly View**: 7-day board (Monday–Sunday)
- **Navigate** between days and weeks

### 🎨 Design
- **Dark Mode** toggle with smooth transitions
- **Modern UI** with card layouts, shadows, and animations
- **Responsive** design (works on desktop and mobile)
- **Accessible** with keyboard shortcuts and ARIA labels

### 🔍 Filters & Search
- **Search** tasks by title or description
- **Filter** by status (All/Active/Completed) and priority
- **Sort** by due date, priority, or manual order

### 💾 Persistence
- All tasks and settings saved to **localStorage**
- App restores state on reload

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus search
- `Ctrl/Cmd + N`: Add new task
- `Escape`: Close modals
- `Tab`: Navigate through controls

## Setup Instructions

### Option 1: Direct Open
1. Simply open `index.html` in any modern web browser
2. That's it! No installation or build process required

### Option 2: Local Server (Optional)
If you prefer to run a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## File Structure

```
Lightbeast/
├── index.html    # Main HTML structure
├── styles.css    # All styling and theming
├── app.js        # Application logic
└── README.md     # This file
```

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Usage Guide

### Adding a Task
1. Click the **"Add Task"** button
2. Fill in the task details (title is required)
3. Click **"Save Task"**

### Managing Tasks
- **Complete a task**: Click the checkbox
- **Edit a task**: Click the "Edit" button
- **Delete a task**: Click the "Delete" button and confirm
- **Reorder tasks**: Drag and drop within the same day
- **Move to another day**: Drag and drop to a different day column (weekly view)

### Switching Views
- Click **"Today"** for daily view
- Click **"This Week"** for weekly view
- Use the **arrow buttons** to navigate between periods

### Filtering & Searching
- Type in the **search box** to filter tasks
- Use the **status dropdown** to show All/Active/Completed tasks
- Use the **priority dropdown** to filter by priority level
- Use the **sort dropdown** to change the sort order

### Theme Toggle
- Click the **sun/moon icon** in the header to switch between light and dark modes

## Technical Details

### Built With
- **HTML5**: Semantic markup
- **CSS3**: Custom properties (variables), Grid, Flexbox
- **JavaScript (ES6+)**: Vanilla JS with IIFE pattern

### Key Features
- **No dependencies**: Completely self-contained
- **Event delegation**: Efficient event handling
- **localStorage API**: Data persistence
- **HTML5 Drag & Drop API**: Drag and drop functionality
- **CSS Variables**: Easy theming
- **Responsive Design**: Mobile-first approach

### Code Quality
- Modular architecture (IIFE pattern)
- Clean, commented code
- XSS prevention (HTML escaping)
- Accessible (WCAG compliant)
- Performance optimized

## Security

- All user input is sanitized to prevent XSS attacks
- No external API calls or tracking
- All data stored locally in your browser

## Performance

- Handles hundreds of tasks smoothly
- Efficient DOM updates
- GPU-accelerated CSS transitions
- Minimal reflows and repaints

## License

This project is open source and available for personal and commercial use.

## Credits

Built by Antigravity as a demonstration of vanilla web development best practices.

---

**Enjoy organizing your tasks with Lightbeast! 🚀**
