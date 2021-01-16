import React from 'react';

import { Content } from '../content/Content';
import { Main } from '../layout/Main';
import { Meta } from '../layout/Meta';

const About = () => (
  <Main meta={<Meta title="Lorem ipsum" description="Lorem ipsum" />} showInfo>
    <Content>
      <p>
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ratione fuga recusandae quidem.
        Quaerat molestiae blanditiis doloremque possimus labore voluptatibus distinctio recusandae
        autem esse explicabo molestias officia placeat, accusamus aut saepe.
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ratione fuga recusandae quidem.
        Quaerat molestiae blanditiis doloremque possimus labore voluptatibus distinctio recusandae
        autem esse explicabo molestias officia placeat, accusamus aut saepe.
      </p>
    </Content>
  </Main>
);

export default About;
