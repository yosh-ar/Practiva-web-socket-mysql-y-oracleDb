module.exports = {
    user: "bi",
    password: process.env.NODE_ORACLEDB_PASSWORD,
    // password: 'manager1',
    connectString:"(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(Host="+'srvqa02.ipg.com.gt'+")(Port="+'1521'+"))(CONNECT_DATA=(SID="+'dbprodpi'+")))"
};