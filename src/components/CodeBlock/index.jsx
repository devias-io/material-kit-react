import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx.min';
import 'prismjs/components/prism-json';
import 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace';

// Prism theme
import './prism.css';

class CodeBlock extends Component {
  render() {
    const { language, code } = this.props;
    const codeHTML = Prism.highlight(code, Prism.languages[language], language);

    return (
      <pre className={`language-${language}`}>
        <code dangerouslySetInnerHTML={{ __html: codeHTML }} />
      </pre>
    );
  }
}

CodeBlock.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired
};

export default CodeBlock;
