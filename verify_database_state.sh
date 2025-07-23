#!/bin/bash

# Database State Verification Script
# Verifies database integrity and provides pre/post change comparisons

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Database State Verification${NC}"
echo "================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL environment variable not set${NC}"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql command not found${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo -e "${BLUE}🔍 Checking database connection...${NC}"
if psql "$DATABASE_URL" -c '\q' &>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    exit 1
fi

echo
echo -e "${BLUE}📋 Current Database State:${NC}"
echo "=========================="

# Get basic database info
echo -e "${YELLOW}Database Info:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    current_database() as database_name,
    current_user as connected_user,
    version() as postgres_version;
"

echo
echo -e "${YELLOW}Table Count Summary:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname IN ('public') 
GROUP BY schemaname;
"

echo
echo -e "${YELLOW}Big Baby Course Related Data:${NC}"

# Check courses table
echo "📚 Courses (Big Baby related):"
psql "$DATABASE_URL" -c "
SELECT 
    id,
    title,
    description,
    price,
    CASE WHEN LENGTH(description) > 100 THEN LEFT(description, 100) || '...' ELSE description END as short_desc
FROM courses 
WHERE LOWER(title) LIKE '%big baby%' OR LOWER(title) LIKE '%big%baby%'
ORDER BY id;
" 2>/dev/null || echo "Courses table not accessible"

echo
echo "📖 Chapters for Big Baby Course:"
psql "$DATABASE_URL" -c "
SELECT 
    c.id as chapter_id,
    c.course_id,
    c.title as chapter_title,
    c.order_index,
    co.title as course_title
FROM chapters c
JOIN courses co ON c.course_id = co.id
WHERE LOWER(co.title) LIKE '%big baby%' OR LOWER(co.title) LIKE '%big%baby%'
ORDER BY c.course_id, c.order_index
LIMIT 10;
" 2>/dev/null || echo "Chapters table not accessible"

echo
echo "📄 Lessons count for Big Baby Course:"
psql "$DATABASE_URL" -c "
SELECT 
    co.title as course_title,
    COUNT(l.id) as lesson_count
FROM courses co
LEFT JOIN chapters c ON co.id = c.course_id
LEFT JOIN lessons l ON c.id = l.chapter_id
WHERE LOWER(co.title) LIKE '%big baby%' OR LOWER(co.title) LIKE '%big%baby%'
GROUP BY co.id, co.title;
" 2>/dev/null || echo "Lessons table not accessible"

echo
echo -e "${YELLOW}User Purchase Data:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    COUNT(*) as total_purchases,
    COUNT(DISTINCT user_id) as unique_users
FROM user_course_purchases 
WHERE course_id IN (
    SELECT id FROM courses 
    WHERE LOWER(title) LIKE '%big baby%' OR LOWER(title) LIKE '%big%baby%'
);
" 2>/dev/null || echo "Purchase data not accessible"

echo
echo -e "${BLUE}🔧 Database Schema Information:${NC}"
echo "=============================="

# Check for recent schema changes
echo -e "${YELLOW}Recent Table Modifications:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
"

echo
echo -e "${YELLOW}Table Sizes:${NC}"
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"

echo
echo -e "${GREEN}✅ Database state verification complete${NC}"
echo
echo -e "${BLUE}💡 Usage Tips:${NC}"
echo "- Run this script before making changes to capture baseline state"
echo "- Run again after changes to verify modifications"
echo "- Save output to file: ./verify_database_state.sh > db_state_$(date +%Y%m%d_%H%M%S).txt"
echo "- Use for troubleshooting data integrity issues"