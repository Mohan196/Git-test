// Custom exceptions let you express domain-specific errors clearly
class InsufficientFundsException extends Exception {
    public InsufficientFundsException(String message) {
        super(message);
    }
}

class BankAccount {
    private double balance;

    public BankAccount(double balance) {
        this.balance = balance;
    }

    public void withdraw(double amount) throws InsufficientFundsException {
        if (amount > balance) {
            throw new InsufficientFundsException(
                "Cannot withdraw $" + amount + ", balance is only $" + balance);
        }
        balance -= amount;
        System.out.println("Withdrew $" + amount + ". New balance: $" + balance);
    }
}

public class CustomExceptionDemo {
    public static void main(String[] args) {
        BankAccount account = new BankAccount(100.0);

        try {
            account.withdraw(30.0);
            account.withdraw(200.0); // this will fail
        } catch (InsufficientFundsException e) {
            System.out.println("Transaction failed: " + e.getMessage());
        }

        System.out.println("Program continues after handling the error.");
    }
}
