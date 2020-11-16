let video;
//KNN classifier 생성
const knnClassifier = ml5.KNNClassifier();
let poseNet;
let poses = [];

var no = 1;
var name= new Array();
var tag = new Array();
var target = document.getElementById('me');
var tagText = document.getElementById('txt').value;

var btnName;
var ex;
var reset;
var conf;

var resultP = 1;//jsonAdd 2번 실행 안되게끔 방지하는 변수.
//



// tts 이벤트 영역
const selectLang = document.getElementById("select-lang")
const text = document.getElementById("text")
const btnRead = document.getElementById("btn-read")

function setup() {
  const canvas = createCanvas(780, 600);
  canvas.parent('videoContainer');
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create the UI buttons
  createButtons();

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
}

function modelReady(){
  select('#status').html('model Loaded')
}

// Add the current frame from the video to the classifier
function addExample(label) {
  // Convert poses results to a 2d array [[score0, x0, y0],...,[score16, x16, y16]]
  const poseArray = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);

  // Add an example with a label to the classifier
  knnClassifier.addExample(poseArray, label);
  updateCounts();


}

// Predict the current frame.
function classify() {
  // Get the total number of labels from knnClassifier
  const numLabels = knnClassifier.getNumLabels();
  if (numLabels <= 0) {
    console.error('There is no examples in any label');
    return;
  }
  // Convert poses results to a 2d array [[score0, x0, y0],...,[score16, x16, y16]]
  const poseArray = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);

  // Use knnClassifier to classify which label do these features belong to
  // You can pass in a callback function `gotResults` to knnClassifier.classify function
  knnClassifier.classify(poseArray, gotResults);
}

function autoClick(classN,saveT){
  let intervalId;
  $(classN).mousedown(function() {//classN이 들어가는 곳
    intervalId = setInterval(do_something, 25); // intervalId에 값을 넣어 0.5초 간격으로 do_something을 실행
  }).mouseup(function() {
    clearInterval(intervalId); //do_something을 종료
  });

  function do_something() { //intervalId에서 실행될 행동을 적음
    addExample(saveT);
  }
}

// A util function to create UI buttons
function createButtons() {

  autoClick('#addClassA', '아리아');

  autoClick('#addClassD', '동작없음');

  for(var i = 1; i <= no;i++){
    autoClick('#'+btnName+''+i, tag[i]);
  }



  // Predict button
  buttonPredict = select('#buttonPredict');
  buttonPredict.mousePressed(classify);

  // Clear all classes button
  buttonClearAll = select('#clearAll');
  buttonClearAll.mousePressed(clearAllLabels);

  buttonGetData = select('#save');
 buttonGetData.mousePressed(saveMyKNN);
}

// Show the results

function gotResults(err, result) {
  // Display any error
  // if (err) {
  //   console.error(err);
  // }

  if (result.confidencesByLabel) {
    const confidences = result.confidencesByLabel;
    // result.label is the label that has the highest confidence
    if (result.label) {
      // select('#result').html(result.label);
      // select('#confidence').html(`${confidences[result.label] * 100} %`);

      for(var i = 0; i<Object.keys(confidences).length; i++){
        if(confidences[Object.keys(confidences)[i]] == 1){
          select('#result').html(Object.keys(confidences)[i]);
          select('#videoText').html(Object.keys(confidences)[i]);
          select('#confidence').html(`${confidences[Object.keys(confidences)[i]] * 100} %`);
        }
      }
      if(resultP != 0){
        jsonAdd(confidences)
        updateCounts();
      }


      // if(`${confidences[result.label]}`==1.0){ //퍼센트 판단.
      //   setTimeout(function() {
      //     if(result.label == '동작없음'){
      //       speak(text.value, {
      //         rate: 1,
      //         pitch: 1.2,
      //         lang: "ko-KR"
      //       })
      //     }
      //   }, 2000);

        // if(result.label == '동작없음'){
        //   speak(text.value, {
        //     rate: 1,
        //     pitch: 1.2,
        //     lang: "ko-KR"
        //   })
        // }else if(result.label == '아리아'){
        //   text.value = ``;
        //   text.value += `${results.label}  `;
        // }else{
        //   text.value += `${results.label}  `;
        // }
      //}

    }

    // select('#confidenceA').html(`${confidences['아리아'] ? confidences['아리아'] * 100 : 0} %`);
    // select('#confidenceD').html(`${confidences['동작없음'] ? confidences['동작없음'] * 100 : 0} %`);
  }

  classify();
}

// Update the example count for each label
function updateCounts() {
  const counts = knnClassifier.getCountByLabel();

  select('#exampleA').html(counts['아리아'] || 0);
  select('#exampleD').html(counts['동작없음'] || 0);

  for(var i = 1; i<=no;i++){
    select('#'+ex+''+i).html(counts[''+tag[i]] || 0);
  }

}

// Clear the examples in one label
function clearLabel(classLabel) {
  knnClassifier.clearLabel(classLabel);
  updateCounts();
}

// Clear all the examples in all labels
function clearAllLabels() {
  knnClassifier.clearAllLabels();
  updateCounts();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  image(video, 0, 0, width, height);
  strokeWeight(2);
  // For one pose only (use a for loop for multiple poses!)
  if (poses.length > 0) {
    let pose = poses[0].pose;
    for (let i = 0; i < pose.keypoints.length; i++) {
      fill(213, 0, 143);
      noStroke();
      ellipse(pose.keypoints[i].position.x, pose.keypoints[i].position.y, 8);
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[0].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}

function speak(text, opt_prop) {
  if (typeof SpeechSynthesisUtterance === "undefined" || typeof window.speechSynthesis === "undefined") {
      alert("이 브라우저는 음성 합성을 지원하지 않습니다.")
      return
  }

  window.speechSynthesis.cancel() // 현재 읽고있다면 초기화

  const prop = opt_prop || {}

  const speechMsg = new SpeechSynthesisUtterance()
  speechMsg.rate = prop.rate || 1 // 속도: 0.1 ~ 10
  speechMsg.pitch = prop.pitch || 1 // 음높이: 0 ~ 2
  speechMsg.lang = prop.lang || "ko-KR"//
  speechMsg.text = text

  // SpeechSynthesisUtterance에 저장된 내용을 바탕으로 음성합성 실행
  window.speechSynthesis.speak(speechMsg)

  document.getElementById("text").innerText = "";

}

// speak(text.value, {
//   rate: 1,
//   pitch: 1.2,
//   lang: "ko-KR"
// })

//
var file = document.querySelector('#getfile');

file.onchange = function () {
    var fileList = file.files ;

    // 읽기
    var reader = new FileReader();
    reader.readAsText(fileList [0]);

    //로드 한 후
    reader.onload = function  () {
      var obj = JSON.parse(reader.result);
        loadMyKNN(obj);
    };
};

function loadMyKNN(aa) {
    // var myObj = JSON.parse("./myKNNDataset.json");
    // var mydata = JSON.parse(dataset);
    knnClassifier.load(aa, updateCounts);
    //jsonAdd();
}

function saveMyKNN() {
  knnClassifier.save('myKNNDataset');
}
//

function add() {
  target = document.getElementById('me');
  tagText = document.getElementById('txt').value;

        if(no >= 0) {

          btnName = "btn";
          ex = "ex";
          reset = "reset"
          conf = "con";
          target.innerHTML += "<br><button id="+btnName+""+no+">모션 학습 : " + tagText + "</button>";
          //target.innerHTML += "<button id="+reset+""+no+">삭제</button>";
          target.innerHTML += "<p><span class='example' id="+ex+""+no+">0</span> 추가된 " + tagText + " 모션</p>";
          // target.innerHTML += "<p class='AA'> Confidence : <span class='example' id="+conf+""+no+">0</span></p>";
          name[no] = btnName;
          tag[no] = tagText;

          no++;

        }else {

               target.innerHTML += '<input type="button" value="버튼'+no+'" />';

        }
        createButtons();
        resultP = 0;
}

function jsonAdd(confidences) {
  target = document.getElementById('me');

  for(var i = 0; i<Object.keys(confidences).length; i++){
    if(Object.keys(confidences)[i]=='아리아' || Object.keys(confidences)[i]=='동작없음'){
      continue;
    }
    tagText = Object.keys(confidences)[i];
    console.log(tagText);
    if(tagText != null) {

      btnName = "btn";
      ex = "ex";
      reset = "reset"
      conf = "con";
      target.innerHTML += "<br><button id="+btnName+""+no+">모션 학습 : " + tagText + "</button>";
      //target.innerHTML += "<button id="+reset+""+no+">삭제</button>";
      target.innerHTML += "<p><span class='example' id="+ex+""+no+">0</span> 추가된 " + tagText + " 모션</p>";
      // target.innerHTML += "<p class='AA'> Confidence : <span class='example' id="+conf+""+no+">0</span></p>";
      name[no] = btnName;
      tag[no] = tagText;

      no++;

    }else {
      target.innerHTML += '<input type="button" value="버튼'+no+'" />';
    }
    createButtons();
    resultP = 0;
    //updateCounts();


  }


}
