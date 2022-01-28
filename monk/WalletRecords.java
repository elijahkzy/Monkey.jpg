import java.util.*;
import java.net.*;
import org.json.simple.parser.JSONParser;
import org.json.simple.JSONObject;
import org.json.simple.JSONArray;

public class WalletRecords {
    String id;
    ArrayList<Transaction> records;

    WalletRecords(String id) {
        this.id = id;
        this.records = new ArrayList<>();
    }

    public void generateRecords() throws Exception {
        String s = "https://api.etherscan.io/api?module=account&action=txlist&address=" + this.id
                + "&startblock=0&endblock=99999999&sort=asc&apikey=17MQ9NR6BSEBH3DD2GDVZXC8JB6P8KZ9SS";
        URL url = new URL(s);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.connect();
        String str = new String();
        if (conn.getResponseCode() == 200) {
            Scanner scan = new Scanner(url.openStream());
            while (scan.hasNext()) {
                str += scan.nextLine();
            }
            scan.close();
        }

        JSONParser parser = new JSONParser();
        JSONObject obj = (JSONObject) parser.parse(str);

        JSONArray arr = (JSONArray) obj.get("result");
        for (Object o : arr) {
            JSONObject x = (JSONObject) o;
            Transaction txn = new Transaction((String) x.get("hash"));
            txn.generateDetails();
            this.records.add(txn);
        }
    }
}
