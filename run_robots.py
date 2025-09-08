import subprocess
import sys

# Define a class for terminal colors to make the output easy to read
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    RESET = '\033[0m'

# --- CONFIGURATION ---
# Define the exact order in which your Node.js robots should run.
# You can easily add or remove robots from this list in the future.
ROBOT_SCRIPTS = [
    'build-upcoming-tv.js',
    'build-archive-tv.js',
    'build-movies.js',
    'build-rawg.js',
    'build-master.js'
]

def run_robot(script_name):
    """
    Runs a single Node.js script, captures its output, and checks for errors.
    """
    print(f"{Colors.YELLOW}--- Starting robot: {script_name} ---{Colors.RESET}")
    
    command = ['node', script_name]
    
    try:
        # We use subprocess.run to execute the command and wait for it to complete.
        # capture_output=True saves the output, text=True makes it readable text.
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            check=False # We set check to False to handle errors ourselves
        )

        # Print the standard output from the Node.js script
        if result.stdout:
            print(result.stdout)

        # Check the return code. A code of 0 means success. Any other number means failure.
        if result.returncode == 0:
            print(f"{Colors.GREEN}--- SUCCESS: {script_name} finished successfully. ---{Colors.RESET}\n")
            return True
        else:
            print(f"{Colors.RED}--- FAILURE: {script_name} failed! ---{Colors.RESET}")
            # If there was an error, print the error message from the script
            if result.stderr:
                print(f"{Colors.RED}Error Details:\n{result.stderr}{Colors.RESET}\n")
            return False

    except FileNotFoundError:
        # This error happens if 'node' is not installed or not in the system's PATH
        print(f"{Colors.RED}Error: 'node' command not found. Is Node.js installed correctly?{Colors.RESET}\n")
        return False
    except Exception as e:
        # Catch any other unexpected errors
        print(f"{Colors.RED}An unexpected error occurred while running {script_name}: {e}{Colors.RESET}\n")
        return False

def main():
    """
    The main function that orchestrates running all the robot scripts.
    """
    print(f"{Colors.GREEN}Starting the build orchestration process...{Colors.RESET}")
    
    for script in ROBOT_SCRIPTS:
        success = run_robot(script)
        # If any robot fails, we stop the entire process immediately.
        if not success:
            print(f"{Colors.RED}Build process halted due to a failure in {script}.{Colors.RESET}")
            sys.exit(1) # Exit the app with an error code

    print(f"{Colors.GREEN}✅ All robots ran successfully! Your website is ready.{Colors.RESET}")

# This is the standard entry point for a Python script.
if __name__ == "__main__":
    main()
