#!/bin/bash

# 🔍 System Check Script
# Verify if the target machine is ready for deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Global variables
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# Function to update counters
pass_check() {
    ((CHECKS_PASSED++))
    print_pass "$1"
}

fail_check() {
    ((CHECKS_FAILED++))
    print_fail "$1"
}

warn_check() {
    ((CHECKS_WARNED++))
    print_warn "$1"
}

# Check operating system
check_os() {
    print_check "Operating System..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        pass_check "Linux detected: $(lsb_release -d 2>/dev/null | cut -f2 || echo "Unknown distribution")"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        pass_check "macOS detected: $(sw_vers -productVersion)"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
        pass_check "Windows detected"
    else
        warn_check "Unknown OS: $OSTYPE (may still work)"
    fi
}

# Check available memory
check_memory() {
    print_check "Available Memory..."
    
    if command -v free &> /dev/null; then
        # Linux
        TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.1f", $2/1024}')
        AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
        
        if (( $(echo "$TOTAL_MEM >= 4.0" | bc -l) )); then
            pass_check "Total memory: ${TOTAL_MEM}GB (Available: ${AVAILABLE_MEM}GB)"
        elif (( $(echo "$TOTAL_MEM >= 2.0" | bc -l) )); then
            warn_check "Total memory: ${TOTAL_MEM}GB (Minimum met, but 4GB+ recommended)"
        else
            fail_check "Total memory: ${TOTAL_MEM}GB (Less than minimum 2GB required)"
        fi
    elif command -v vm_stat &> /dev/null; then
        # macOS
        TOTAL_MEM=$(sysctl -n hw.memsize | awk '{printf "%.1f", $1/1024/1024/1024}')
        if (( $(echo "$TOTAL_MEM >= 4.0" | bc -l) )); then
            pass_check "Total memory: ${TOTAL_MEM}GB"
        else
            warn_check "Total memory: ${TOTAL_MEM}GB (4GB+ recommended)"
        fi
    else
        warn_check "Cannot determine memory size"
    fi
}

# Check available disk space
check_disk() {
    print_check "Available Disk Space..."
    
    if command -v df &> /dev/null; then
        AVAILABLE_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
        
        if [ "$AVAILABLE_GB" -ge 20 ]; then
            pass_check "Available space: ${AVAILABLE_GB}GB"
        elif [ "$AVAILABLE_GB" -ge 10 ]; then
            warn_check "Available space: ${AVAILABLE_GB}GB (Minimum met, but 20GB+ recommended)"
        else
            fail_check "Available space: ${AVAILABLE_GB}GB (Less than minimum 10GB required)"
        fi
    else
        warn_check "Cannot determine disk space"
    fi
}

# Check if Docker is installed
check_docker() {
    print_check "Docker Installation..."
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version 2>/dev/null | cut -d ' ' -f3 | cut -d ',' -f1)
        pass_check "Docker installed: $DOCKER_VERSION"
        
        # Check if Docker daemon is running
        if docker info &> /dev/null; then
            pass_check "Docker daemon is running"
        else
            fail_check "Docker is installed but daemon is not running"
        fi
    else
        fail_check "Docker is not installed"
        echo "       Install from: https://docs.docker.com/get-docker/"
    fi
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_check "Docker Compose Installation..."
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version 2>/dev/null | cut -d ' ' -f3 | cut -d ',' -f1)
        pass_check "Docker Compose installed: $COMPOSE_VERSION"
    elif docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version 2>/dev/null | cut -d ' ' -f3)
        pass_check "Docker Compose (plugin) installed: $COMPOSE_VERSION"
    else
        fail_check "Docker Compose is not installed"
        echo "       Install from: https://docs.docker.com/compose/install/"
    fi
}

# Check if Git is installed
check_git() {
    print_check "Git Installation..."
    
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d ' ' -f3)
        pass_check "Git installed: $GIT_VERSION"
    else
        fail_check "Git is not installed"
        echo "       Install with: sudo apt install git (Linux) or brew install git (macOS)"
    fi
}

# Check network connectivity
check_network() {
    print_check "Network Connectivity..."
    
    if command -v curl &> /dev/null; then
        if curl -s --connect-timeout 5 https://docker.com > /dev/null; then
            pass_check "Internet connectivity: OK"
        else
            fail_check "Cannot reach internet (required for Docker image downloads)"
        fi
    elif command -v wget &> /dev/null; then
        if wget -q --spider --timeout=5 https://docker.com; then
            pass_check "Internet connectivity: OK"
        else
            fail_check "Cannot reach internet (required for Docker image downloads)"
        fi
    else
        warn_check "Cannot test network (curl/wget not available)"
    fi
}

# Check if ports are available
check_ports() {
    print_check "Port Availability..."
    
    PORTS=(3001 8001 5432)
    ALL_PORTS_FREE=true
    
    for PORT in "${PORTS[@]}"; do
        if command -v lsof &> /dev/null; then
            if lsof -i :$PORT &> /dev/null; then
                warn_check "Port $PORT is in use (may cause conflicts)"
                ALL_PORTS_FREE=false
            fi
        elif command -v netstat &> /dev/null; then
            if netstat -ln | grep ":$PORT " &> /dev/null; then
                warn_check "Port $PORT is in use (may cause conflicts)"
                ALL_PORTS_FREE=false
            fi
        fi
    done
    
    if $ALL_PORTS_FREE; then
        pass_check "Required ports (3001, 8001, 5432) are available"
    fi
}

# Check system requirements summary
show_summary() {
    echo ""
    echo "📋 System Check Summary"
    echo "======================"
    echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
    echo -e "${YELLOW}Warnings: $CHECKS_WARNED${NC}"
    echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        if [ $CHECKS_WARNED -eq 0 ]; then
            echo -e "${GREEN}✅ System is ready for deployment!${NC}"
            echo ""
            echo "Next steps:"
            echo "1. Clone the repository: git clone <repo-url>"
            echo "2. Run setup: ./setup-docker.sh"
            echo "3. Access your app: http://localhost:3001"
        else
            echo -e "${YELLOW}⚠️  System is ready but has warnings${NC}"
            echo "You can proceed with deployment, but monitor for issues"
        fi
    else
        echo -e "${RED}❌ System is not ready for deployment${NC}"
        echo "Please fix the failed checks before proceeding"
    fi
    
    echo ""
}

# Show installation instructions
show_install_instructions() {
    if [ $CHECKS_FAILED -gt 0 ]; then
        echo "🔧 Installation Instructions"
        echo "==========================="
        
        if ! command -v docker &> /dev/null; then
            echo ""
            echo "📦 Install Docker:"
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
                echo "  sudo sh get-docker.sh"
                echo "  sudo usermod -aG docker \$USER"
                echo "  newgrp docker"
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                echo "  Download Docker Desktop from: https://docs.docker.com/docker-for-mac/install/"
                echo "  Or use Homebrew: brew install --cask docker"
            else
                echo "  Visit: https://docs.docker.com/get-docker/"
            fi
        fi
        
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
            echo ""
            echo "🔧 Install Docker Compose:"
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                echo "  sudo apt install docker-compose-plugin"
            else
                echo "  Docker Compose is included with Docker Desktop"
            fi
        fi
        
        if ! command -v git &> /dev/null; then
            echo ""
            echo "📝 Install Git:"
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                echo "  sudo apt install git"
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                echo "  brew install git"
            else
                echo "  Visit: https://git-scm.com/downloads"
            fi
        fi
        
        echo ""
    fi
}

# Main function
main() {
    echo "🔍 Household Services - System Check"
    echo "===================================="
    echo ""
    
    check_os
    check_memory
    check_disk
    check_docker
    check_docker_compose
    check_git
    check_network
    check_ports
    
    show_summary
    show_install_instructions
}

# Run the checks
main