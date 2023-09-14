import { pipeline, env } from "@xenova/transformers";

// Skip local model check
env.allowLocalModels = false;

// Use the Singleton pattern to enable lazy construction of the pipeline.
class PipelineSingleton {
  //   static task = "text-classification";
  //   static model = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
  // static task = "feature-extraction";
  // static model = "Xenova/all-MiniLM-L6-v2";
  static task = "text-classification";
  static model = "Xenova/toxic-bert";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  // Retrieve the classification pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  let classifier = await PipelineSingleton.getInstance((x) => {
    // We also add a progress callback to the pipeline so that we can
    // track model loading.
    self.postMessage(x);
  });

  // Actually perform the classification
  let output = await classifier(event.data.text, { topk: null });

  let formattedOutput = {};

  // Object.entries(output).forEach(([key, value]) => {
  //   formattedOutput[key] = value;
  // });

  // console.log(output,'non formatted output')
  // console.log(formattedOutput, "formattedOutput");

  console.log(output, "output");
  self.postMessage({
    status: "complete",
    text: event.data.text,
    output: output,
  });
});
