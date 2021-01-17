import React from 'react';

import { Content } from '../components/Content';
import { Main } from '../components/Main';
import { Meta } from '../components/Meta';

const About = () => (
  <Main meta={<Meta title="Lorem ipsum" description="Lorem ipsum" />} showInfo>
    <Content>
      <h2>
        Where I worked
      </h2>
      <ul className="list-disc">
        <li>
          <a target="_blank" rel="noopener noreferrer" href="https://cysec.systems/">
            Cysec
          </a>
          {' '}
          as an intern for the summer, working on cybersecurity and software development (summer
          2020, 2 months)
        </li>
        <li>
          <a target="_blank" rel="noopener noreferrer" href="https://je.epfl.ch/">
            JE EPFL
          </a>
          {' '}
          as a freelancer for a full stack web project (summer 2019, 2 months)
        </li>
        <li>
          <a target="_blank" rel="noopener noreferrer" href="https://je.epfl.ch/">
            JE EPFL
          </a>
          {' '}
          as a freelancer for a blockchain project (winter 2018, 2 months)
        </li>
        <li>
          <a target="_blank" rel="noopener noreferrer" href="http://summus.tech/">
            Summus
          </a>
          {' '}
          as co-founder for a B2B software company (2017 - 2019, 2 years)
        </li>
        <li>
          <a target="_blank" rel="noopener noreferrer" href="https://leflair.vn/">
            Leflair
          </a>
          {' '}
          in Vietnam as an intern for the summer, working on improving their ERP (summer 2017, 2
          months)
        </li>
        <li>
          <a target="_blank" rel="noopener noreferrer" href="https://agepoly.ch/">
            AGEPoly
          </a>
          {' '}
          as IT manager (2015 - 2017, 2 years)
        </li>
      </ul>
      <br />
      <h2>
        What I
        {' '}
        <span className="is-blue">accomplished</span>
      </h2>
      <ul className="list-disc">
        <li>
          Several great performances at CTFs worldwide with the
          {' '}
          <a target="_blank" rel="noopener noreferrer" href="https://ctftime.org/team/53791">
            polygl0ts
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.swissnexsanfrancisco.org/startups/xgrant/"
          >
            Xgrant Entrepreneurship Camps
          </a>
          {' '}
          in San Francisco (summer 2018)
        </li>
        <li>
          <a target="_blank" rel="noopener noreferrer" href="./BusinessConcept.pdf">
            Innosuisse Start-up Training: Business Concept
          </a>
          , a 14-week training program (spring 2018)
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://twitter.com/START_Hack/status/967761563150057478"
          >
            First place at the Start Hack Hackathon
          </a>
          {' '}
          where we also won the NEO blockchain prize (spring 2018)
        </li>
      </ul>
      <br />
      <h2>
        What I
        {' '}
        <span className="is-yellow">coded</span>
      </h2>
      <ul className="list-disc">
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/louismerlin/concrete.css"
          >
            concrete.css
          </a>
          {' '}
          a simple and to the point CSS microframework, powering this site
        </li>
        <li>
          <a target="_blank" rel="noopener noreferrer" href="https://github.com/louismerlin/repfl">
            repfl
          </a>
          {' '}
          a web app to find a free room at EPFL
        </li>
        <li>
          <a target="_blank" rel="noopener noreferrer" href="https://github.com/louismerlin/reeq">
            reeq
          </a>
          {' '}
          a ultra simple, ultra light, dependency-free and tree-shakeable HTTP client for the
          browser, made with JSON in mind
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/louismerlin/neo-caritas"
          >
            Neo Caritas
          </a>
          {' '}
          a smart contract & interface for providing reliable income to NGOs on the NEO Blockchain,
          winner of
          {' '}
          <a href="https://starthack.ch">Start Hack</a>
          {' '}
          2018
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/GaspardPeduzzi/opentimes"
          >
            The Open Times
          </a>
          {' '}
          an autonomous and peer reviewed journal built upon the Colony platform, built at ETHBERLIN
          2018
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/louismerlin/blinc.click"
          >
            blinc.click
          </a>
          {' '}
          an incremental game on the Ethereum blockchain
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/louismerlin/spydeer"
          >
            Spydeer
          </a>
          {' '}
          a web app that keeps a log of the people who connected to your local network
        </li>
      </ul>
      <br />
      <h2>
        What I
        {' '}
        <span className="is-green">can do</span>
      </h2>
      <ul className="list-disc">
        <li>Javascript (React, Node)</li>
        <li>Go</li>
        <li>Python (Django, NumPy, SciKit)</li>
        <li>C / C++</li>
        <li>Docker</li>
        <li>Blockchain (Ethereum, Neo)</li>
        <li>Style with CSS</li>
        <li>Scala</li>
      </ul>
      <br />
      <h2>
        What I
        {' '}
        <span className="is-red">love</span>
      </h2>
      <ul className="list-disc">
        <li>Reading</li>
        <li>Running</li>
        <li>Coding stuff</li>
        <li>
          Playing music (find
          {' '}
          <strong>Louis Merlin</strong>
          {' '}
          on your favorite streaming platform)
        </li>
        <li>Making friends</li>
      </ul>
      <br />
    </Content>
  </Main>
);

export default About;
