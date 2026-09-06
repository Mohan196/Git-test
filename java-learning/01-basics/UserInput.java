import java.util.Scanner;

public class UserInput {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("What's your name? ");
        String name = scanner.nextLine();

        System.out.print("What's your age? ");
        int age = scanner.nextInt();

        System.out.println("Hi " + name + "! In 10 years you'll be " + (age + 10) + ".");

        scanner.close();
    }
}
