"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import {cn} from "@/utils/Cn";

export const Avatar = ({className, ...props}) => {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn(
                "relative flex size-10 shrink-0 overflow-hidden rounded-full",
                className,
            )}
            {...props}
        />
    );
}

export const AvatarImage = ({className, ...props}) => {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn("aspect-square size-full", className)}
            {...props}
        />
    );
}

export const AvatarFallback = ({className, ...props}) => {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                "bg-muted flex size-full items-center justify-center rounded-full",
                className,
            )}
            {...props}
        />
    );
}
