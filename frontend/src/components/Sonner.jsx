"use client";

import { Toaster as Sonner } from "sonner";

export const Toaster = (props) => {
    return (
        <Sonner
            theme="system"
            className="toaster group"
            position="top-right"
            richColors
            closeButton
            style={{
                "--normal-bg": "var(--popover)",
                "--normal-text": "var(--popover-foreground)",
                "--normal-border": "var(--border)",
            }}
            {...props}
        />
    );
};
