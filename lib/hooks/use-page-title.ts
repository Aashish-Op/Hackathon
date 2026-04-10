"use client";

import * as React from "react";

export function usePageTitle(title: string) {
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = title;
    }
  }, [title]);
}
