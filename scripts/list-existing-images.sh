#!/bin/bash

# Script to list all existing images in the old structure
# This helps you understand what images you have and where to move them

echo "📸 EXISTING IMAGES INVENTORY"
echo "=========================================="
echo ""

BASE_DIR="/Users/supanda/Desktop/backup-22-25/AI/claude/household-services/public/images/subcategories"

# Function to list images in a category
list_category_images() {
    local category=$1
    local cat_name=$2
    
    if [ -d "$BASE_DIR/$category" ]; then
        local images=$(find "$BASE_DIR/$category" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) | sort)
        local count=$(echo "$images" | grep -v '^$' | wc -l | tr -d ' ')
        
        if [ $count -gt 0 ]; then
            echo "📁 $cat_name ($count images)"
            echo "   Location: public/images/subcategories/$category/"
            echo ""
            echo "$images" | while read -r img; do
                if [ -n "$img" ]; then
                    filename=$(basename "$img")
                    echo "   - $filename"
                fi
            done
            echo ""
            echo "---"
            echo ""
        fi
    fi
}

# List images for each category
list_category_images "electrical" "⚡ ELECTRICAL"
list_category_images "cleaning" "🧹 CLEANING"
list_category_images "call-a-service" "📞 CALL A SERVICE"
list_category_images "civil-work" "🏗️ CIVIL WORK"
list_category_images "finance-insurance" "💰 FINANCE & INSURANCE"

echo ""
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo ""

# Count totals
electrical_count=$(find "$BASE_DIR/electrical" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) 2>/dev/null | wc -l | tr -d ' ')
cleaning_count=$(find "$BASE_DIR/cleaning" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) 2>/dev/null | wc -l | tr -d ' ')
call_count=$(find "$BASE_DIR/call-a-service" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) 2>/dev/null | wc -l | tr -d ' ')
civil_count=$(find "$BASE_DIR/civil-work" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) 2>/dev/null | wc -l | tr -d ' ')
finance_count=$(find "$BASE_DIR/finance-insurance" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" \) 2>/dev/null | wc -l | tr -d ' ')
plumbing_count=$(find "$BASE_DIR/plumbing" -type f \( -name "*.jpg" -o -name "*.png" \) 2>/dev/null | wc -l | tr -d ' ')

total_old=$((electrical_count + cleaning_count + call_count + civil_count + finance_count))
total_all=$((total_old + plumbing_count))

echo "Images in OLD structure (need organizing):"
echo "  - Electrical: $electrical_count images"
echo "  - Cleaning: $cleaning_count images"
echo "  - Call A Service: $call_count images"
echo "  - Civil Work: $civil_count images"
echo "  - Finance Insurance: $finance_count images"
echo "  Subtotal: $total_old images"
echo ""
echo "Images in NEW structure (already organized):"
echo "  - Plumbing: $plumbing_count images (across 6 subcategories)"
echo ""
echo "✅ Total images available: $total_all images"
echo ""
echo "❌ Missing categories (need download):"
echo "  - Personal Care: 0 images (need ~12-15 images)"
echo ""
echo "=========================================="
echo "💡 NEXT STEPS"
echo "=========================================="
echo ""
echo "1. Organize existing images into subcategory folders"
echo "2. Download images for Personal Care category"
echo "3. Update database with correct image paths"
echo ""
echo "See FOLDER_STRUCTURE_SUMMARY.md for detailed instructions"
echo ""
