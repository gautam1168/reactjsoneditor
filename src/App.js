import React, { Component } from 'react';
import logo from './logo.svg';
import {Editor, EditorState, ContentState, CompositeDecorator} from 'draft-js';
import './App.css';

const styles = {
  root: {
	fontFamily: '\'Helvetica\', sans-serif',
	padding: 20,
	width: 600,
  },
  editor: {
	border: '1px solid #ddd',
	cursor: 'text',
	fontSize: 16,
	minHeight: 40,
	padding: 10,
  },
  button: {
	marginTop: 10,
	textAlign: 'center',
  },
  attribute: {
	color: 'rgba(98, 177, 254, 1.0)',
	direction: 'ltr',
	unicodeBidi: 'bidi-override',
  },
  value: {
	color: 'green',
	direction: 'ltr',
	unicodeBidi: 'bidi-override',
  },
  hashtag: {
	color: 'rgba(95, 184, 138, 1.0)',
  },
};

	  function getPreviousText(contentState, key){
		let blockbefore, textbefore;
		blockbefore = contentState.getBlockBefore(key)
		while (blockbefore != null){
			textbefore = blockbefore.getText()
			for (var i = textbefore.length-1; i >= 0; i--){
				if (/[^\n\r]/.test(textbefore[i])){
					return textbefore[i]
				}
			}
		}
		return ""
	  }

	  function searchQuotedString(predecessors, contentBlock, callback, contentState){
		const text = contentBlock.getText()
		const key = contentBlock.getKey()

  		let inreadzone = false, findingStartingQuot = true, start, end, previoustext;

		previoustext = getPreviousText(contentState, key)
		if (predecessors.test(previoustext)){
			inreadzone = true
		}
  		for (let i = 0; i < text.length; i++){
			if (predecessors.test(text[i])){
				inreadzone = true
			}
			if(text[i] === '"' && inreadzone && findingStartingQuot){
  				start = i;
  				findingStartingQuot = false;
  			}
  			else if (text[i] === '"' && inreadzone){
  				end = i+1;
  				callback(start, end);
				findingStartingQuot = true;
  				inreadzone = false;
  			}
  		}
	  }

	  function valueStrategy(contentBlock, callback, contentState) {
		  searchQuotedString(/[:]/, contentBlock, callback, contentState)
	  }

      function attributeStrategy(contentBlock, callback, contentState) {
		  searchQuotedString(/[{,]/, contentBlock, callback, contentState)
      }

      const AttributeSpan = (props) => {
        return (
          <span
            style={styles.attribute}
            data-offset-key={props.offsetKey}
          >
            {props.children}
          </span>
        );
	};

	const ValueSpan = (props) => {
		  return (
			<span
			  style={styles.value}
			  data-offset-key={props.offsetKey}
			>
			  {props.children}
			</span>
		  );
	  };

class ParseBtn extends Component {
	constructor(props) {
		super(props);
		this.handleClick = this.handleClick.bind(this)
	}

	handleClick(e) {
		this.props.parseEditorText()
	}

	render() {
		return (
			<button onClick={this.handleClick}>Parse</button>
		);
	}
}

class JSONEditor extends Component {
	constructor(props) {
		super(props);
		this.onChange = this.props.editorStateUpdator
	}

	render() {
		return (
			<Editor editorState={this.props.editorState}
					onChange={this.onChange}
					placeholder="Paste JSON here"
					textAlignment="left"/>
		);
	}
}

class App extends Component {
  constructor(props) {
	  super(props);
	  this.decorator = new CompositeDecorator([
		{
			strategy : attributeStrategy,
			component : AttributeSpan
		},
		{
			strategy : valueStrategy,
			component : ValueSpan
		}
	  ])
	  this.state = {
		  editorState : EditorState.createEmpty(this.decorator)
	  }
	  this.parseEditorText = this.parseEditorText.bind(this)
	  this.editorStateUpdator = this.editorStateUpdator.bind(this)
  }

  editorStateUpdator(editorState){
	  this.setState({editorState: editorState})
  }

  parseEditorText(){
	  let contentState = this.state.editorState.getCurrentContent();
	  let text, formattedText = ""
	  try{
		  text = JSON.stringify(JSON.parse(contentState.getPlainText("")))
	  }
	  catch (e){
		  alert("Invalid JSON: ", e.toString())
	  }
	  let numtabs = 0
	  for (var i = 0; i < text.length; i++){
		  if (text[i] == "{"){
			  formattedText += "{\n"+"\t".repeat(numtabs)
			  numtabs += 1
		  }
		  else if (text[i] == "}"){
			  numtabs -= 1
			  formattedText += "\n"+"\t".repeat(numtabs)+"}"
		  }
		  else if (text[i] == ","){
			  formattedText += ",\n"+"\t".repeat(numtabs)
		  }
		  else{
			  formattedText += text[i]
		  }
	  }

	  let newContentState = ContentState.createFromText(formattedText);
	  let newEditorState = EditorState.createWithContent(newContentState, this.decorator)
	  this.setState({editorState: newEditorState})
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
			<ParseBtn editorState={this.state.editorState}
					  parseEditorText={this.parseEditorText}/>
			<JSONEditor editorState={this.state.editorState}
						editorStateUpdator={this.editorStateUpdator}/>
      </div>
    );
  }
}

export default App;
