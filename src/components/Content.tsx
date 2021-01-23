import React, { ReactNode, useEffect } from 'react';

type IContentProps = {
  children: ReactNode;
};

const Content = (props: IContentProps) => {
  useEffect(() => {
    const allP = document.querySelectorAll('p');
    allP.forEach((p: any) => {
      if (p.firstChild.nodeName === 'IMG') {
        p.classList.add('text-center');
      }
    });
  });

  return (
    <div className="content">
      {props.children}

      <style jsx>
        {`
          .content :global(p) {
            @apply my-6 leading-7;
          }

          .content :global(h2) {
            @apply text-4xl text-black font-bold;
          }

          .content :global(h3) {
            @apply text-xl font-semibold text-black my-4;
          }

          .content :global(h4) {
            @apply text-lg font-semibold text-black my-4;
          }

          .content :global(em) {
            @apply text-sm;
          }

          .content :global(img) {
            @apply mx-auto;
          }

          .content :global(blockquote) {
            @apply text-gray-600 text-lg py-1 px-6 border-l-2;
          }

          .content :global(ul) {
            @apply list-disc my-6 px-8;
          }

          .content :global(ol) {
            @apply list-decimal my-6 px-8;
          }

          .content :global(li) {
            @apply leading-8;
          }

          .content :global(a) {
            @apply text-blue-500 underline font-semibold hover:text-blue-700;
          }

          .content :global(code) {
            @apply text-sm;
          }

        `}
      </style>
    </div>
  );
};

export { Content };
