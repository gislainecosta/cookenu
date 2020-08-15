import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { AddressInfo } from "net";
import { IdGenerator } from "./services/IdGenerator";
import { UserDatabase } from "./data/UserDatabase";
import { RecipeDatabase } from "./data/RecipeDatabase";
import { Authenticator } from "./services/Authenticator";
import HashManager from "./services/HashManager";
import { BaseDatabase } from "./data/BaseDatabase";
import moment from "moment";
import { FollowDatabase } from "./data/FollowDatabase";


moment.locale("pt-br")
dotenv.config();
const app = express();
app.use(express.json());

app.post("/signup", async (req: Request, res: Response) => {
  try {    
    const userData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,

    };

    const idGenerator = new IdGenerator();
    const id = idGenerator.generate();

    const hashManager = new HashManager();
    const hashPassword = await hashManager.hash(userData.password);
    
    const userDb = new UserDatabase();
    await userDb.createUser(id, userData.name, userData.email, hashPassword);

    const authenticator = new Authenticator();
    const token = authenticator.generateToken({
      id      
    });

    res.status(200).send({
      token,
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  try {
   
    if (!req.body.email || req.body.email.indexOf("@") === -1) {
      throw new Error("Invalid email");
    }

    const userData = {
      email: req.body.email,
      password: req.body.password,
    };

    const userDatabase = new UserDatabase();
    const user = await userDatabase.getUserByEmail(userData.email);
    
    const hashManager = new HashManager();
    const compareResult = await hashManager.compare(
      userData.password,
      user.password
    );

    if (!compareResult) {
      throw new Error("Invalid password");
    }

    const authenticator = new Authenticator();
    const token = authenticator.generateToken({
      id: user.id
    });

    res.status(200).send({
      token,
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
  await BaseDatabase.destroyConnection();
});

//app.delete("/user/:id", async (req: Request, res: Response) => {
//  try {
//    const token = req.headers.token as string;
//
//    const authenticator = new Authenticator();
//    const authenticationData = authenticator.getData(token);
//
//    if (authenticationData.role !== "admin") {
//      throw new Error("Only a admin user can access this funcionality");
//    }
//
//    const id = req.params.id;
//
//    const userDatabase = new UserDatabase();
//    await userDatabase.deleteUser(id);
//
//    res.sendStatus(200);
//  } catch (err) {
//    res.status(400).send({
//      message: err.message,
//    });
//  }
//  await BaseDatabase.destroyConnection();
//});

app.post("/recipe", async (req: Request, res: Response) => {
  try {
    const token = req.headers.token as string;
    
    const authenticator = new Authenticator();
    const authenticationData = authenticator.getData(token);
    const id_Author = authenticationData.id;
    const createdAt = Date.now()  

    console.log(createdAt)
    const recipeData = {
      title: req.body.title,
      recipe_description: req.body.recipe_description
    };

    const recipeDatabase = new RecipeDatabase();   
    await recipeDatabase.createRecipe(id_Author, recipeData.title, recipeData.recipe_description, createdAt);

    res.status(200).send({
      mensagem: "Receita criada com sucesso!"
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
});

app.post("/user/follow", async (req: Request, res: Response) => {
  try {
    if (!req.body.userToFollowId || req.body.userToFollowId === " ") {
      throw new Error("Insira um id");
    }
    const token = req.headers.token as string;
    
    const authenticator = new Authenticator();
    const authenticationData = authenticator.getData(token);
    const id_follower = authenticationData.id;
    const id_followed = req.body.userToFollowId

    const followId = new FollowDatabase();
    const idDb = await followId.isValidIdFollow(id_followed);

    if (idDb.quantity === 0) {
      throw new Error("Insira um id válido");
    }
    
    const followDb = new FollowDatabase();   
    await followDb.createFollow(id_followed, id_follower);   

    res.status(200).send({
      mensagem: "Followed successfully"
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
});

app.delete("/user/unfollow", async (req: Request, res: Response) => {
  try {
    if (!req.body.userToUnfollowId || req.body.userToUnfollowId === " ") {
      throw new Error("Insira um id");
    }
    
    const token = req.headers.token as string;
    
    const authenticator = new Authenticator();
    const authenticationData = authenticator.getData(token);
    const id_follower = authenticationData.id;
    const id_followed = req.body.userToUnfollowId

    const followId = new FollowDatabase();
    const idDb = await followId.isValidIdUnfollow(id_followed);
    
    if (idDb.quantity === 0) {
      throw new Error("Insira um id válido");
    }
    const followDb = new FollowDatabase();   
    await followDb.deleteFollow(id_followed, id_follower);

    res.status(200).send({
      mensagem: "Unfollowed successfully"
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
});

app.get("/user/profile", async (req: Request, res: Response) => {
  try {
    const token = req.headers.token as string;

    const authenticator = new Authenticator();
    const authenticationData = authenticator.getData(token);

    
    const userDb = new UserDatabase();
    const user = await userDb.getUserById(authenticationData.id);

    console.log("Token", authenticationData)
    console.log("id", user)

    res.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }
});

app.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const token = req.headers.token as string;

    const authenticator = new Authenticator();
    authenticator.getData(token);
		// a gente PRECISA verificar se o token não está expirado

    const id = req.params.id;

    const userDatabase = new UserDatabase();
    const user = await userDatabase.getUserById(id);

    res.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email      
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

});

const server = app.listen(process.env.PORT || 3000, () => {
  if (server) {
    const address = server.address() as AddressInfo;
    console.log(`Server is running in http://localhost:${address.port}`);
  } else {
    console.error(`Failure upon starting server.`);
  }
});

app.get("/recipe/:id", async (req: Request, res: Response) => {
  try {
    const token = req.headers.token as string;

    const authenticator = new Authenticator();
    authenticator.getData(token);
		
    const id = Number(req.params.id);

    const recipeDatabase = new RecipeDatabase();
    const recipe = await recipeDatabase.getRecipeById(id);

    const dataFormatada = moment(recipe.createdAt).format("DD/MM/YYYY HH:mm")
    
    res.status(200).send({
      id: recipe.id_Recipe,
	    title: recipe.title,
	    description: recipe.recipe_description,
	    cratedAt: dataFormatada   
    });
  } catch (err) {
    res.status(400).send({
      message: err.message,
    });
  }

});

