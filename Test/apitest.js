const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../server.js");

chai.use(chaiHttp);
chai.should();
describe("API Tests", () => {
  describe("Is API working", () => {
    it("should return status 200 and a message", (done) => {
      chai
        .request(app)
        .get("/")
        .end((err, res) => {
            res.body.message.should.equal("Ek Salary Aur API");
            done();
        });
    });
  });
});
