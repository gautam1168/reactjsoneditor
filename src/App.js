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
  editorContainer: {
	width: "50%",
	float: "left"
  },
  visualizerContainer: {
	width: "50%",
	float: "left"
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

	  function searchQuotedString(regex, contentBlock, callback, contentState){
		const text = contentBlock.getText()
		const key = contentBlock.getKey()

  		let inreadzone = false, findingStartingQuot = true, start, end;
		let searchres

		while((searchres = regex.exec(text)) !== null){
			callback(searchres.index, searchres.index + searchres[1].length)
		}
	  }

	  function valueStrategy(contentBlock, callback, contentState) {
		  searchQuotedString(/:\s*("\w*")/g, contentBlock, callback, contentState)
	  }

      function attributeStrategy(contentBlock, callback, contentState) {
		  searchQuotedString(/("\w+")\s*:/g, contentBlock, callback, contentState)
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

class Visualizer extends Component {
	constructor(props) {
		super(props);
	}
	validDashboardJSON() {
		let keyarray = Object.keys(this.props.layoutJSON)
		let valid = true
		valid = valid && keyarray.indexOf("totalrows") >= 0 &&
					keyarray.indexOf("totalcols") >= 0 &&
					keyarray.indexOf("blockHeight") >= 0 &&
					keyarray.indexOf("widgets") >= 0
		if (valid){
			this.props.layoutJSON.widgets.forEach(wid => {
				let widkeys = Object.keys(wid)
				valid = valid && widkeys.indexOf("xpos") >= 0 &&
							widkeys.indexOf("ypos") >= 0 &&
							widkeys.indexOf("colspan") >= 0 &&
							widkeys.indexOf("rowspan") >= 0 &&
							widkeys.indexOf("index") >= 0
			})
		}
		return valid
	}
	render() {
		// console.log(this.validDashboardJSON())
		if (this.validDashboardJSON()){
			let widgetboxes = null
			widgetboxes = this.props.layoutJSON.widgets.map(wid => {
				return <rect x={parseInt(wid.xpos)*100/parseInt(this.props.layoutJSON.totalcols)}
							 y={parseInt(wid.ypos)*100/parseInt(this.props.layoutJSON.totalcols)}
							width={100*parseInt(wid.colspan)/parseInt(this.props.layoutJSON.totalcols)}
							height={100*parseInt(wid.rowspan)/parseInt(this.props.layoutJSON.totalcols)}
					  key={wid.index} fill={"none"} stroke={"#aaa"} strokeWidth={0.2}/>
			})
			// console.log(widgetboxes)
			return (
				<svg width={"100%"} height={"100%"} style={{border: "solid 1px #ccc"}}
					 viewBox={`0 0 100 100`}>
					 { widgetboxes }
				</svg>
			);
		}
		return null
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
		  if (text[i] === "{"){
			  numtabs += 1
			  formattedText += "{\n"+"\t".repeat(numtabs)
		  }
		  else if (text[i] === "}"){
			  numtabs -= 1
			  formattedText += "\n"+"\t".repeat(numtabs)+"}"
		  }
		  else if (text[i] === ","){
			  formattedText += ",\n"+"\t".repeat(numtabs)
		  }
		  else{
			  formattedText += text[i]
		  }
	  }

	  let newContentState = ContentState.createFromText(formattedText);
	  let newEditorState = EditorState.createWithContent(newContentState)
	  this.setState({editorState: newEditorState})
	  window.setTimeout(()=>{
	  	this.setState({editorState: EditorState.set(this.state.editorState, {decorator: this.decorator})})
	},0)
  }

  render() {
	let layoutOBJ
	try{
		layoutOBJ = JSON.parse(this.state.editorState.getCurrentContent().getPlainText())
	}
	catch(e){
		layoutOBJ = {}
	}
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
			<ParseBtn editorState={this.state.editorState}
					  parseEditorText={this.parseEditorText}/>
		    <div style={styles.editorContainer}>
				<JSONEditor editorState={this.state.editorState}
						editorStateUpdator={this.editorStateUpdator}/>
			</div>
			<div style={styles.visualizerContainer}>
				<Visualizer layoutJSON={layoutOBJ}/>
			</div>
	  </div>
    );
  }
}

export default App;
