const express = require('express');
const req = require('express/lib/request');
const res = require('express/lib/response');
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json())

const customers = [];

//middleware
function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).json({ error: "Customer not found!" })
    }

    req.customer = customer;

    return next();
}

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */
app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customersAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customersAlreadyExists) {
        return res.status(400).json({ error: "Customer already exists!" });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return res.sendStatus(201);

});

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
    const { description, amount } = req.body;

    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);
    return res.sendStatus(201);
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return res.status(400).json({ error: "Insufficient funds!" });
    };

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return res.sendStatus(201);
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) =>
        statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return res.json(statement);
});

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name = name;

    return res.sendStatus(201);
});

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    console.log("full",customers)

    customers.splice(customer, 1);

    console.log("apos delite",customers)

    return res.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    const balance = getBalance(customer.statement);
    return res.json(balance);
});

app.listen(8080);