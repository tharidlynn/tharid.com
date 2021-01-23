import React, { ReactNode } from 'react';

import Link from 'next/link';

import { Config } from '../lib/Config';
import { Navbar } from './Navbar';

type IMainProps = {
  meta: ReactNode;
  showInfo: boolean;
  children: ReactNode;
};

const Layout = (props: IMainProps) => (
  <>
    <div className="antialiased w-full text-gray-700">
      {props.meta}

      <div className="max-w-screen-md mx-auto px-8">
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
              <Link href="/projects/">
                <a>Projects</a>
              </Link>
            </li>
            <li className="mr-6">
              <a href="https://github.com/tharidlynn">GitHub</a>
            </li>
          </Navbar>
        </div>

        {props.showInfo ? (
          <div className="pt-4 pb-4">
            <div className="font-semibold text-black text-2xl">{Config.title}</div>
            <div className="text-base">{Config.description}</div>
          </div>
        ) : (
          ''
        )}

        <div className="text-lg py-5">{props.children}</div>

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
          <a href="https://momorith.com" className="text-gray-700 hover:text-gray-600 transition">
            Momorith
          </a>
        </div>
      </div>
    </div>
  </>
);

export { Layout };
