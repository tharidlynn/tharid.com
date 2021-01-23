import React from 'react';

import Link from 'next/link';

import { convertUrlToLinkHref } from '../lib/Pagination';

export type IPaginationProps = {
  previous?: string;
  next?: string;
};

const Pagination = (props: IPaginationProps) => (
  <div className="text-sm flex justify-between">
    {props.previous && (
      <div className="text-base">
        <Link href={convertUrlToLinkHref(props.previous)} as={props.previous}>
          <a className="text-blue-500 hover:text-blue-700">← Newer Posts</a>
        </Link>
      </div>
    )}

    {props.next && (
      <div className="text-right ml-auto text-base">
        <Link href={convertUrlToLinkHref(props.next)} as={props.next}>
          <a className="text-blue-500 hover:text-blue-700">Older Posts →</a>
        </Link>
      </div>
    )}
  </div>
);

export { Pagination };
