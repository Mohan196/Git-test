public class Variables {
    public static void main(String[] args) {
        // Java is statically typed: every variable declares its type up front.
        int age = 25;                 // whole numbers
        double price = 19.99;         // decimals
        char grade = 'A';             // single character, single quotes
        boolean isJavaFun = true;     // true or false
        String name = "Alice";        // text, double quotes (String is a class, not primitive)

        System.out.println(name + " is " + age + " years old.");
        System.out.println("Price: $" + price);
        System.out.println("Grade: " + grade);
        System.out.println("Is Java fun? " + isJavaFun);

        // Basic arithmetic
        int a = 10, b = 3;
        System.out.println("a + b = " + (a + b));
        System.out.println("a / b = " + (a / b));   // integer division -> 3
        System.out.println("a % b = " + (a % b));   // remainder -> 1
        System.out.println("a / (double) b = " + (a / (double) b)); // 3.333...
    }
}
