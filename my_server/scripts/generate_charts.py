import os
import sys
import json
import base64
from io import BytesIO
import pymongo
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
import dns.resolver

# Prevent matplotlib from trying to open a GUI window
matplotlib.use('Agg')

# Use Google DNS to prevent ECONNREFUSED on windows for srv connections
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']

# Configure font that supports Vietnamese (you might need to install Arial or similar if not found)
try:
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'Tahoma', 'DejaVu Sans']
except:
    pass

# Read DB connection from .env or use fallback
DB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://admin1:123123123@cluster0.kwb0xy7.mongodb.net/group04_db?appName=Cluster0')

def fig_to_base64(fig):
    """Convert a matplotlib figure to a base64 encoded PNG string."""
    buf = BytesIO()
    fig.savefig(buf, format="png", bbox_inches='tight', transparent=True, dpi=120)
    buf.seek(0)
    b64_string = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return b64_string

def main():
    try:
        # 1. Connect to MongoDB
        client = pymongo.MongoClient(DB_URI)
        db = client.get_database('group04_db')
        
        # 2. Fetch Orders Data
        orders_cursor = db.orders.find({}, {"_id": 1, "createdAt": 1, "total": 1, "status": 1, "items": 1})
        orders_list = list(orders_cursor)
        client.close()

        if not orders_list:
            # Output empty JSON if no data
            print(json.dumps({"salesChart": "", "categoriesChart": ""}))
            return

        # 3. Prepare DataFrame for Sales Performance
        df_orders = pd.DataFrame(orders_list)
        
        # Parse dates
        if 'createdAt' in df_orders.columns:
            df_orders['createdAt'] = pd.to_datetime(df_orders['createdAt'], errors='coerce')
        else:
            # Fallback
            df_orders['createdAt'] = pd.Timestamp.now()
            
        # Ensure status column exists
        if 'status' not in df_orders.columns:
            df_orders['status'] = 'Completed'
            
        # Ensure total column exists
        if 'total' not in df_orders.columns:
            df_orders['total'] = 0
            
        # Filter out cancelled/refunded for revenue
        df_valid_orders = df_orders[~df_orders['status'].isin(['Cancelled', 'Refunded'])].copy()

        # Group by day of week for the last 7 days, or just by day name
        df_valid_orders['day_name'] = df_valid_orders['createdAt'].dt.day_name()
        
        # Map English day names to Vietnamese
        day_mapping = {
            'Monday': 'Th 2', 'Tuesday': 'Th 3', 'Wednesday': 'Th 4',
            'Thursday': 'Th 5', 'Friday': 'Th 6', 'Saturday': 'T 7', 'Sunday': 'CN'
        }
        df_valid_orders['day_vi'] = df_valid_orders['day_name'].map(day_mapping)
        
        # Aggregate revenue by day
        sales_by_day = df_valid_orders.groupby('day_vi')['total'].sum().reindex(['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'T 7', 'CN']).fillna(0)

        # 4. Generate Sales Chart
        fig_sales, ax_sales = plt.subplots(figsize=(8, 4))
        ax_sales.bar(sales_by_day.index, sales_by_day.values, color='#0b422e', width=0.6)
        
        # Styling
        ax_sales.spines['top'].set_visible(False)
        ax_sales.spines['right'].set_visible(False)
        ax_sales.spines['left'].set_visible(False)
        ax_sales.yaxis.grid(True, linestyle='--', alpha=0.3)
        ax_sales.tick_params(axis='y', left=False)
        ax_sales.tick_params(axis='x', bottom=False)
        
        # Format y-axis to millions
        ax_sales.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, p: f'{int(x/1000000)}M' if x > 0 else '0'))
        
        sales_base64 = fig_to_base64(fig_sales)

        # 5. Prepare DataFrame for Categories
        # Extract items from orders
        all_items = []
        for order in orders_list:
            if 'items' in order and isinstance(order['items'], list):
                all_items.extend(order['items'])
                
        if all_items:
            df_items = pd.DataFrame(all_items)
            # Check if category exists, fallback to type or a default
            if 'category' in df_items.columns:
                cat_col = 'category'
            elif 'type' in df_items.columns:
                cat_col = 'type'
            else:
                df_items['category'] = 'Khác'
                cat_col = 'category'
                
            # Count categories
            category_counts = df_items[cat_col].value_counts().head(5)
            
            # 6. Generate Categories Chart (Horizontal Bar or Pie)
            fig_cats, ax_cats = plt.subplots(figsize=(6, 4))
            
            # Let's draw a nice pie chart
            colors = ['#0b422e', '#146e4e', '#1c9a6f', '#8da49c', '#d1dbd8']
            ax_cats.pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%', 
                        startangle=90, colors=colors, textprops={'fontsize': 10}, 
                        wedgeprops={'edgecolor': 'white', 'linewidth': 2})
            ax_cats.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
            
            cats_base64 = fig_to_base64(fig_cats)
        else:
            cats_base64 = ""

        # 7. Output JSON
        result = {
            "salesChart": sales_base64,
            "categoriesChart": cats_base64
        }
        
        print(json.dumps(result))

    except Exception as e:
        # Output error as JSON
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
