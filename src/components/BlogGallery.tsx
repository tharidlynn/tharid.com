import React from 'react';

import { format } from 'date-fns';
import Link from 'next/link';

import { PostItems } from '../lib/Content';
import { Pagination, IPaginationProps } from './Pagination';

export type IBlogGalleryProps = {
  type: string;
  posts: PostItems[];
  pagination: IPaginationProps;
};

const BlogGallery = (props: IBlogGalleryProps) => (
  <>
    <ul>
      {props.posts.map((elt) => (
        <Link href="/posts/[slug]" as={`/posts/${elt.slug}`}>
          <a>
            <li key={elt.slug} className="mb-16">
              <div className="mb-1 md:mb-1">
                <h3 className="text-gray-900 text-2xl font-medium hover:text-gray-700">
                  {elt.title}
                </h3>
              </div>

              {/* <div className="hidden md:block text-sm text-gray-600">
              {format(new Date(elt.date), 'LLL yy')}
            </div> */}
              {/* <div className="block md:hidden text-sm text-gray-600 my-2">
            {format(new Date(elt.date), 'LLL yy')}
          </div> */}
              <p className="text-md text-gray-600  hover:text-gray-700">
                {`${format(new Date(elt.date), 'MMM d, yyyy')} - ${elt.description}`}
              </p>
            </li>
          </a>
        </Link>
      ))}
    </ul>
    {props.type === 'posts' && (
      <Pagination previous={props.pagination.previous} next={props.pagination.next} />
    )}
  </>
);

export { BlogGallery };
