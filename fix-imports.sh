#!/bin/bash

# Fix all version-specific imports in UI components
cd /Users/thomaschappell/first-year-student-accelerator

# List of all the packages that need fixing
packages=(
  "react-aspect-ratio"
  "react-avatar" 
  "react-checkbox"
  "react-collapsible"
  "react-context-menu"
  "react-dialog"
  "react-dropdown-menu"
  "react-hover-card"
  "react-label"
  "react-menubar"
  "react-navigation-menu"
  "react-popover"
  "react-progress"
  "react-radio-group"
  "react-scroll-area"
  "react-select"
  "react-separator"
  "react-slider"
  "react-switch"
  "react-tabs"
  "react-toggle"
  "react-toggle-group"
  "react-tooltip"
)

# Fix each package
for package in "${packages[@]}"; do
  echo "Fixing @radix-ui/$package imports..."
  find app/components/ui -name "*.tsx" -exec sed -i '' "s/@radix-ui\/$package@[0-9.]*/@radix-ui\/$package/g" {} \;
done

# Fix other packages
echo "Fixing other package imports..."
find app/components/ui -name "*.tsx" -exec sed -i '' 's/recharts@[0-9.]*/recharts/g' {} \;
find app/components/ui -name "*.tsx" -exec sed -i '' 's/embla-carousel-react@[0-9.]*/embla-carousel-react/g' {} \;

echo "All imports fixed!"
