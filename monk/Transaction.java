import java.util.*;
import java.net.*;
import org.json.simple.parser.JSONParser;
import org.json.simple.JSONObject;

public class Transaction {
    String hash;
    String timestamp;
    String fromWalletID;
    String toWalletID;
    double value;

    Transaction(String hash) {
        this.hash = hash;
        this.timestamp = "";
        this.fromWalletID = "";
        this.toWalletID = "";
        this.value = 0.0;
    }

    public void generateDetails() throws Exception {
        String s = "https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=" + this.hash
                + "&apikey=17MQ9NR6BSEBH3DD2GDVZXC8JB6P8KZ9SS";
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

        JSONObject o = (JSONObject) obj.get("result");
        this.timestamp = (String) o.get("timeStamp");
        this.fromWalletID = (String) o.get("from");
        this.toWalletID = (String) o.get("to");
        this.value = (Double) o.get("value");
    }
}
