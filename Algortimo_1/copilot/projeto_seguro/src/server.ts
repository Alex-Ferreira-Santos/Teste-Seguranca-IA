import express from "express";
import session from "express-session";
import helmet from "helmet";
import csrf from "csurf";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(express.json());

app.use(session({
  secret: "uma_chave_secreta_segura",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // coloque true em produção com HTTPS
    maxAge: 1000 * 60 * 15 // 15 minutos
  }
}));

app.use(csrf());

app.use("/auth", routes);

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
