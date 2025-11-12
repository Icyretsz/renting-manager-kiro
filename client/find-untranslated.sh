#!/bin/bash

# Script to help find hardcoded English strings in React components
# This is a helper tool - manual review is still needed

echo "🔍 Searching for potential untranslated strings in React components..."
echo ""

# Common patterns that might indicate hardcoded English text
# This is not exhaustive but covers common cases

echo "📝 Checking for hardcoded button labels..."
grep -rn --include="*.tsx" --include="*.ts" \
  -e "\"Add " -e "\"Edit " -e "\"Delete " -e "\"Save " -e "\"Cancel " \
  -e "\"Submit " -e "\"Close " -e "\"View " -e "\"Update " \
  src/pages src/components | grep -v "useTranslation" | head -20

echo ""
echo "📝 Checking for hardcoded titles..."
grep -rn --include="*.tsx" \
  -e "<Title.*>.*[A-Z]" \
  src/pages src/components | grep -v "useTranslation" | grep -v "{t(" | head -20

echo ""
echo "📝 Checking for hardcoded messages..."
grep -rn --include="*.tsx" \
  -e "message=\"" -e "description=\"" \
  src/pages src/components | grep -v "useTranslation" | grep -v "{t(" | head -20

echo ""
echo "✅ Search complete!"
echo ""
echo "Note: This is a helper tool. Please manually review all results."
echo "Some results may be false positives (e.g., technical strings, IDs, etc.)"
