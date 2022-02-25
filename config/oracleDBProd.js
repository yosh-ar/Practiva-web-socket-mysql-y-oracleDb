module.exports = {
    user: "bi",
    password: process.env.NODE_ORACLEDB_PASSWORD_PROD,
    // password: 'manager1',
    connectString:"(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(Host="+'198.200.1.208'+")(Port="+'1521'+"))(CONNECT_DATA=(SID="+'dbprodpi'+")))"
};

// DBPRODPI = 
// (DESCRIPTION = 
//     (ADDRESS_LIST = 
//         (ADDRESS = 
//           (COMMUNITY = tcp.world)
//           (PROTOCOL = TCP)
//           (Host = 198.200.1.208)
//           (Port = 1521)
//         )
//     )
//     (CONNECT_DATA = (SID = dbprodpi)    
//     )
//   )