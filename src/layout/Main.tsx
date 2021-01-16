import React, { ReactNode } from 'react';

import Link from 'next/link';

import { Navbar } from '../navigation/Navbar';
import { Config } from '../utils/Config';

type IMainProps = {
  meta: ReactNode;
  showInfo: boolean;
  children: ReactNode;
};

const Main = (props: IMainProps) => (
  <>
    <div className="antialiased w-full text-gray-700">
      {props.meta}

      <div className="max-w-screen-md mx-auto px-6 md:px-10">
        <div className="pt-16 pb-4">
          <Navbar>
            <li className="mr-6">
              <Link href="/">
                <a>Home</a>
              </Link>
            </li>
            <li className="mr-6">
              <Link href="/about/">
                <a>About</a>
              </Link>
            </li>
            <li className="mr-6">
              <a href="https://github.com/tharidlynn">GitHub</a>
            </li>
          </Navbar>
        </div>

        {props.showInfo ? (
          <div className="border-b border-gray-200">
            <div className="pt-4 pb-4">
              <div className="font-semibold text-3xl text-gray-900">{Config.title}</div>
              <div className="text-xl">{Config.description}</div>
            </div>
          </div>
        ) : (
          ''
        )}

        <div className="text-xl py-5">{props.children}</div>

        <div className="border-t border-gray-300 text-center py-8 text-sm">
          © Copyright
          {' '}
          {new Date().getFullYear()}
          {' '}
          {Config.site_name}
          &nbsp;-&nbsp;Created with
          {' '}
          <span role="img" aria-label="Love">
            ♥
          </span>
          {' '}
          by
          {' '}
          <a href="https://momorith.com">Momorith</a>
        </div>
      </div>
    </div>
  </>
);

export { Main };
