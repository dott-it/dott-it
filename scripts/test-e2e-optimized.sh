#!/bin/bash

# Optimized E2E test script with improved concurrency and server management
# This script provides better performance and reliability for Playwright tests

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PORT=3000
MAX_WORKERS=6
TIMEOUT=120
TEST_RESULTS_DIR="test-results"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is in use
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on port
kill_port_processes() {
    print_status "Cleaning up port $PORT..."
    if check_port; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
        else
            fuser -k $PORT/tcp 2>/dev/null || true
        fi
        sleep 2
        print_success "Port $PORT cleaned up"
    else
        print_status "Port $PORT is already free"
    fi
}

# Function to start dev server
start_dev_server() {
    print_status "Starting development server..."
    
    # Kill any existing processes on the port
    kill_port_processes
    
    # Start the dev server in background
    pnpm dev > /dev/null 2>&1 &
    DEV_SERVER_PID=$!
    
    # Wait for server to be ready
    print_status "Waiting for server to be ready..."
    local attempts=0
    local max_attempts=$TIMEOUT
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s http://localhost:$PORT > /dev/null 2>&1; then
            print_success "Development server is ready!"
            return 0
        fi
        
        attempts=$((attempts + 1))
        sleep 1
    done
    
    print_error "Server failed to start within ${TIMEOUT}s"
    kill $DEV_SERVER_PID 2>/dev/null || true
    return 1
}

# Function to run tests with optimized settings
run_tests() {
    local test_type=$1
    local config_file=$2
    
    print_status "Running $test_type tests..."
    
    # Create test results directory
    mkdir -p $TEST_RESULTS_DIR
    
    # Run tests with optimized settings
    if [[ "$test_type" == "local" ]]; then
        # Local development with higher concurrency
        PLAYWRIGHT_CONFIG_FILE=$config_file \
        npx playwright test \
            --config=$config_file \
            --workers=$MAX_WORKERS \
            --reporter=list,html \
            --timeout=60000 \
            --max-failures=15
    else
        # CI/Production with more conservative settings
        PLAYWRIGHT_CONFIG_FILE=$config_file \
        npx playwright test \
            --config=$config_file \
            --workers=2 \
            --reporter=list,html,json \
            --timeout=60000 \
            --max-failures=5
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "$test_type tests completed successfully!"
    else
        print_error "$test_type tests failed with exit code $exit_code"
    fi
    
    return $exit_code
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    
    # Kill dev server if it was started by this script
    if [ ! -z "$DEV_SERVER_PID" ]; then
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on the port
    kill_port_processes
    
    # Clean up any remaining Playwright processes
    if [[ "$OSTYPE" == "darwin"* ]]; then
        pkill -f "playwright" 2>/dev/null || true
    else
        pkill -f "playwright" 2>/dev/null || true
    fi
    
    print_success "Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -l, --local     Run tests in local development mode (higher concurrency)"
    echo "  -c, --ci        Run tests in CI mode (conservative settings)"
    echo "  -w, --workers   Number of workers (default: $MAX_WORKERS for local, 2 for CI)"
    echo "  -p, --port      Port to use (default: $PORT)"
    echo "  -t, --timeout   Server startup timeout in seconds (default: $TIMEOUT)"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --local                    # Run local tests with high concurrency"
    echo "  $0 --ci                       # Run CI tests with conservative settings"
    echo "  $0 --local --workers 8        # Run local tests with 8 workers"
}

# Parse command line arguments
TEST_MODE=""
CONFIG_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--local)
            TEST_MODE="local"
            CONFIG_FILE="playwright-local.config.ts"
            shift
            ;;
        -c|--ci)
            TEST_MODE="ci"
            CONFIG_FILE="playwright.config.ts"
            shift
            ;;
        -w|--workers)
            MAX_WORKERS="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Set default mode if not specified
if [ -z "$TEST_MODE" ]; then
    TEST_MODE="local"
    CONFIG_FILE="playwright-local.config.ts"
fi

# Main execution
main() {
    print_status "Starting optimized E2E test suite..."
    print_status "Mode: $TEST_MODE"
    print_status "Config: $CONFIG_FILE"
    print_status "Workers: $MAX_WORKERS"
    print_status "Port: $PORT"
    
    # Set up trap to cleanup on exit
    trap cleanup EXIT
    
    # Check if config file exists
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "Config file $CONFIG_FILE not found!"
        exit 1
    fi
    
    # Start dev server if not already running
    if ! check_port; then
        start_dev_server
    else
        print_status "Development server already running on port $PORT"
    fi
    
    # Run tests
    run_tests "$TEST_MODE" "$CONFIG_FILE"
    TEST_EXIT_CODE=$?
    
    # Cleanup will be handled by trap
    exit $TEST_EXIT_CODE
}

# Run main function
main "$@" 