#!/bin/bash

INSTALL_DIR="$HOME/.opencode/bin"
SHELL_CONFIG="$HOME/.zshrc"

# Check if the opencode binary exists
if [ ! -f "$INSTALL_DIR/opencode" ]; then
    echo "Error: opencode binary not found at $INSTALL_DIR"
    exit 1
fi

# Check if PATH is already set correctly
if [[ ":$PATH:" == *":$INSTALL_DIR:"* ]]; then
    echo "opencode is already in PATH."
else
    # Add to .zshrc if not present
    if ! grep -q "export PATH=\$HOME/.opencode/bin:\$PATH" "$SHELL_CONFIG"; then
        echo "" >> "$SHELL_CONFIG"
        echo "# opencode" >> "$SHELL_CONFIG"
        echo "export PATH=\$HOME/.opencode/bin:\$PATH" >> "$SHELL_CONFIG"
        echo "Added opencode to PATH in $SHELL_CONFIG"
    else
        echo "opencode path entry found in $SHELL_CONFIG, but not active in current session."
    fi

    # Try to reload the config
    echo "Reloading shell configuration..."
    source "$SHELL_CONFIG"
fi

# Verify
if command -v opencode &> /dev/null; then
    echo "Success! You can now run 'opencode'."
else
    echo "Please restart your terminal or run: source $SHELL_CONFIG"
fi
