import React from 'react';
import {Redirect} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function HomeRedirect() {
  const {i18n: {currentLocale, defaultLocale}} = useDocusaurusContext();
  const target = currentLocale === defaultLocale ? '/docs/intro' : `/${currentLocale}/docs/intro`;
  return <Redirect to={target} />;
}
