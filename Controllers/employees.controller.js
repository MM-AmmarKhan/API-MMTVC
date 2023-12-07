const db = require("../index");
const employee = db.Employees;
const transactions = db.Transactions;
const company = db.company;
const verifyJWT = require('../utils/jwtVerification').verifyJWT;

exports.create = async (req, res) => {
    let isAuth = verifyJWT(req.headers["access-token"]);
    if (isAuth && (req.headers["api_access_key"] == process.env.API_ACCESS_KEY)) {
        if (!req.body)
            return res.status(400).send({ message: "Body Empty" });
        if (req.body.company_id == undefined || req.body.Employees == undefined)
            return res.status(400).send({ message: "Employees Empty" });

        const t = await db.sequelize.transaction();
        let alreadyExistEmployees = 0;
        let invalidEmployees = 0;
        try {
            const companyResult = await db.company.findByPk(req.body.company_id, { transaction: t });

            if (!companyResult) {
                await t.rollback();
                return res.status(400).send({ message: "Company ID not found" });
            }

            const newEmployees = [];
            for (const uploadedEmployee of req.body.Employees) {
                const cnic = uploadedEmployee.cnic;
                if (cnic.length < 10) {
                    invalidEmployees++;
                    continue;
                }
                const existingEmployee = await employee.findOne({ where: { cnic: cnic, isActive: 1 }, transaction: t });
                if (!existingEmployee) {
                    const newEmployee = await employee.create(
                        {
                            name: uploadedEmployee.name,
                            email: uploadedEmployee.email || "",
                            phone: uploadedEmployee.phone || "",
                            amount: uploadedEmployee.amount || 0,
                            cnic: cnic,
                            company_id: req.body.company_id,
                        },
                        { transaction: t }
                    );
                    newEmployees.push(newEmployee);
                }
                else {
                    alreadyExistEmployees++;
                }
            }
            let message = `${newEmployees.length} new employee added`;
            if (alreadyExistEmployees != 0) {
                message += ` and ${alreadyExistEmployees} employee already exist`;
            }
            if (invalidEmployees != 0) {
                message += ` and ${invalidEmployees} employee have Invalid CNIC`;
            }
            await t.commit();
            return res.status(200).send({
                message: message,
                newEmployees,
            });
        } catch (error) {
            console.log(error);
            await t.rollback();
            return res.status(500).send({ message: "Error: Please try again later or contact support" });
        }
    }
    else {
        return res.status(401).send({ message: 'Token Expired' });
    }
};
exports.retrieve = async (req, res) => {
    let isAuth = verifyJWT(req.headers["access-token"]);
    if (isAuth && (req.headers["api_access_key"] == process.env.API_ACCESS_KEY)) {
        try {
            const companyId = req.params.company_id;
            const employees = await employee.findAll({
                where: {
                    company_id: companyId,
                    isActive: 1,
                },
            });
            return res.status(200).send({ employees });
        } catch (error) {
            return res.status(500).send({ message: "Internal Server Error" });
        }
    }
    else {
        return res.status(401).send({ message: 'Token Expired' });
    }
};
exports.update = async (req, res) => {
    let isAuth = verifyJWT(req.headers["access-token"]);
    if (isAuth && (req.headers["api_access_key"] == process.env.API_ACCESS_KEY)) {
        try {
            const employee_id = req.body.employee_id;
            const employeeResult = await employee.findByPk(employee_id);
            if (!employeeResult) {
                return res.status(400).send({ message: "Employee ID not found" });
            }
            employeeResult.name = req.body.name;
            employeeResult.email = req.body.email;
            employeeResult.phone = req.body.phone;
            employeeResult.amount = req.body.amount;
            await employeeResult.save();
            return res.status(200).send({ message: "Employee updated successfully" });
        } catch (error) {
            return res.status(500).send({ message: "Internal Server Error" });
        }
    }
    else {
        return res.status(401).send({ message: 'Token Expired' });
    }
};
exports.delete = async (req, res) => {
    let isAuth = verifyJWT(req.headers["access-token"]);
    if (isAuth && (req.headers["api_access_key"] == process.env.API_ACCESS_KEY)) {
        try {
            const employee_id = req.body.employee_id;
            const transactionsCount = await transactions.count({
                where: {
                    employee_id: employee_id,
                },
            });

            if (transactionsCount === 0) {
                await employee.destroy();
                return res.status(200).send({ message: 'Employees deleted successfully.' });
            } else {
                employee.isActive = false;
                employee.end_date = Date.now();
                await employee.save();
                return res.status(200).send({ message: 'Employees marked inactive successfully.' });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send({ message: 'Internal Server Error' });
        }
    }
    else {
        return res.status(401).send({ message: 'Token Expired' });
    }
};

//// APIs for Employee Transactions
exports.getEmployeeAmountsnDetails = async (req, res) => {
    let isAuth = verifyJWT(req.headers["access-token"]);
    if (isAuth && (req.headers["api_access_key"] == process.env.API_ACCESS_KEY)) {
        try {
            let result = {};
            const company_id = req.params.company_id;
            const employeeResult = await employee.findAll({ where: { company_id: company_id, isActive: 1 } });
            const isFirstInvestment = await transactions.count({ where: { company_id: company_id } });
            if (!employeeResult) {
                return res.status(400).send({ message: "Employees not found" });
            }

            let totalAmount = 0;
            for (const _employee of employeeResult) {
                totalAmount += _employee.amount;
            }
            result.firstMonth = null;
            if (isFirstInvestment !== 0) {
                const CompanyInitialMonth = await company.findOne({ where: { id: company_id } });
                result.firstMonth = CompanyInitialMonth.initial_investment_month;
            }
            result.totalAmount = totalAmount;
            result.employees = employeeResult;
            result.isFirstInvestment = isFirstInvestment === 0 ? true : false;
            return res.status(200).send(result);
        } catch (error) {
            return res.status(500).send({ message: "Internal Server Error" });
        }
    }
    else {
        return res.status(401).send({ message: 'Token Expired' });
    }
}