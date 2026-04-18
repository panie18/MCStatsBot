import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'm3e-shape': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { name?: string },
        HTMLElement
      >;
    }
  }
}
