"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

export const AspectRatio = ({ ...props }) => {
    return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}
