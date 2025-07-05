import express from "express";
import cors from "cors";
import { GoogleGenAI} from "@google/genai";
import bodyParser from "body-parser";

const API_KEY = process.env.API_KEY;

const app = express();
const port = 3000;
const allowedOrigins = [
    "chrome-extension://djgcgkjddomjmfplhiacobjjjgikojjd",
    "http://localhost:3000"
];
app.use(cors({
    origin : allowedOrigins,
    methods : ['GET','POST','PUT','DELETE'],
    credentials : true
}));
app.use(bodyParser.text({extended : true}));

const ai = new GoogleGenAI({apiKey : API_KEY});

async function getmodeldata(userPrompt) {
    try{
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
        });
        console.log(response.text);
        return response.text;
    }
    catch(error){
        console.log(error)
    }
}

//when background script will make a POST request send data from llm model in response

app.post("/",async (req,res)=>{
    const prompt = req.body;
    const model_response = await getmodeldata(prompt);
    //console.log(model_response);
    res.send(model_response);
});

app.listen(port,()=>{
    console.log(`App running on Port ${port}`);
});